import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomUUID } from "crypto";
import type { Document } from "mongodb";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

function guessEncodingAndRate(mime: string | null) {
  // Browser MediaRecorder defaults
  if (mime?.includes("audio/webm")) return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
  if (mime?.includes("audio/ogg")) return { encoding: "OGG_OPUS", sampleRateHertz: 48000 };

  // If you ever send wav
  if (mime?.includes("audio/wav")) return { encoding: "LINEAR16", sampleRateHertz: 16000 };

  // fallback
  return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
}

async function transcribeWithGoogleSTT(audioBuf: Buffer, mimeType: string | null) {
  const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_SPEECH_API_KEY");

  const { encoding, sampleRateHertz } = guessEncodingAndRate(mimeType);

  const sttRes = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding,
          sampleRateHertz,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
        },
        audio: { content: audioBuf.toString("base64") },
      }),
    }
  );

  const sttJson: any = await sttRes.json();

  if (!sttRes.ok) {
    throw new Error(sttJson?.error?.message ?? "Speech-to-Text request failed");
  }

  const text =
    (sttJson.results ?? [])
      .map((r: any) => r.alternatives?.[0]?.transcript)
      .join(" ")
      .trim() ?? "";

  if (!text) throw new Error("Empty transcription");
  return text;
}

async function cleanupWithGemini(raw: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return raw;

  const ai = new GoogleGenAI({ apiKey });

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Clean up this transcript by fixing spacing, punctuation, capitalization, and adding paragraph breaks where natural.\n" +
              "Rules:\n" +
              "- Do NOT paraphrase or reword.\n" +
              "- Do NOT add new information.\n" +
              "- Do NOT remove words.\n" +
              "- Keep the same language.\n" +
              "- Return only the cleaned transcript text.\n\n" +
              "TRANSCRIPT:\n" +
              raw,
          },
        ],
      },
    ],
    config: { temperature: 0.1, maxOutputTokens: 2048 },
  });

  const cleaned = (result.text ?? "").trim();
  return cleaned || raw;
}

export async function POST(req: Request) {
  try {
    // Parse form-data
    const form = await req.formData();

    const file = form.get("audio");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file (field name: 'audio')" },
        { status: 400 }
      );
    }

    const title = String(form.get("title") ?? "").trim();
    const speakerName = String(form.get("speakerName") ?? "").trim();

    // sessionId can come from header or form; otherwise generate one
    const headerSessionId = req.headers.get("x-session-id")?.trim();
    const bodySessionId = String(form.get("sessionId") ?? "").trim();
    const sessionId = headerSessionId || bodySessionId || randomUUID();

    // Read audio bytes into memory (serverless-safe)
    const audioBuf = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || null;

    // 1) Transcribe now
    const rawText = await transcribeWithGoogleSTT(audioBuf, mimeType);

    // 2) (Optional) Clean up with Gemini
    const cleanText = await cleanupWithGemini(rawText);

    // 3) Store in Mongo
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

    const recordings = db.collection<Document>("recordings");
    const transcripts = db.collection<Document>("transcripts");

    const now = new Date();

    const recIns = await recordings.insertOne({
      sessionId,
      title: title || "Untitled recording",
      speakerName: speakerName || null,
      audioMimeType: mimeType,
      audioSizeBytes: audioBuf.length,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });

    const tIns = await transcripts.insertOne({
      recordingId: recIns.insertedId,
      sessionId,
      text: rawText,
      cleanText,
      createdAt: now,
    });

    await recordings.updateOne(
      { _id: recIns.insertedId },
      { $set: { transcriptId: tIns.insertedId, updatedAt: new Date() } }
    );

    return NextResponse.json({
      ok: true,
      sessionId,
      recordingId: String(recIns.insertedId),
      transcriptId: String(tIns.insertedId),
      transcript: cleanText,
      rawTranscript: rawText,
      status: "ready",
    });
  } catch (err: any) {
    console.error("POST /api/recordings error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const sessionId = req.headers.get("x-session-id")?.trim();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing x-session-id header" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

    const recordings = await db
      .collection<Document>("recordings")
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      ok: true,
      recordings: recordings.map((r) => ({
        id: String(r._id),
        title: r.title ?? "Untitled recording",
        speakerName: r.speakerName ?? null,
        status: r.status ?? null,
        transcriptId: r.transcriptId ? String(r.transcriptId) : null,
        createdAt: r.createdAt ?? null,
      })),
    });
  } catch (err) {
    console.error("GET /api/recordings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
