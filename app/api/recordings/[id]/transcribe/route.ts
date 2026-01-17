import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Document } from "mongodb";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function guessEncodingAndRate(mime: string | null) {
  // For MediaRecorder default in Chrome/Edge:
  // audio/webm;codecs=opus  -> WEBM_OPUS, typically 48000 Hz
  if (mime?.includes("audio/webm")) return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
  if (mime?.includes("audio/ogg")) return { encoding: "OGG_OPUS", sampleRateHertz: 48000 };
  // fallback (you can expand later)
  return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid recording id" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_SPEECH_API_KEY" }, { status: 500 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  const recordings = db.collection<Document>("recordings");
  const transcripts = db.collection<Document>("transcripts");

  const recording = await recordings.findOne({ _id: new ObjectId(id) });
  if (!recording?.audioPath) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  await recordings.updateOne(
    { _id: recording._id },
    { $set: { status: "transcribing", updatedAt: new Date() } }
  );

  try {
    const audioPath = path.join(process.cwd(), String(recording.audioPath));
    const audioBuffer = await fs.readFile(audioPath);

    const { encoding, sampleRateHertz } = guessEncodingAndRate(recording.audioMimeType ?? null);

    const sttRes = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding,              // e.g., WEBM_OPUS
            sampleRateHertz,       // must be allowed values for WEBM_OPUS
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBuffer.toString("base64"),
          },
        }),
      }
    );

    const sttJson: any = await sttRes.json();

    if (!sttRes.ok) {
      console.error("STT error:", sttJson);
      throw new Error(sttJson?.error?.message ?? "Speech-to-Text request failed");
    }

    const text =
      (sttJson.results ?? [])
        .map((r: any) => r.alternatives?.[0]?.transcript)
        .join(" ")
        .trim() ?? "";

    if (!text) throw new Error("Empty transcription");

    const ins = await transcripts.insertOne({
      recordingId: recording._id,
      sessionId: recording.sessionId ?? null,
      text,
      createdAt: new Date(),
    });

    await recordings.updateOne(
      { _id: recording._id },
      { $set: { status: "ready", transcriptId: ins.insertedId, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true, transcript: text });
  } catch (err: any) {
    console.error(err);
    await recordings.updateOne(
      { _id: recording._id },
      { $set: { status: "error", error: String(err?.message ?? err), updatedAt: new Date() } }
    );
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
