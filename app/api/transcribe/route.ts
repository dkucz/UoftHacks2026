// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import { SpeechClient } from "@google-cloud/speech";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs"; // important: use Node runtime (not edge)

const speechClient = new SpeechClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wavBase64, languageCode } = body as {
      wavBase64?: string;
      languageCode?: string;
    };

    if (!wavBase64) {
      return NextResponse.json({ error: "Missing wavBase64" }, { status: 400 });
    }

    // Call Google Speech-to-Text using LINEAR16 (WAV PCM)
    const [operation] = await speechClient.longRunningRecognize({
      audio: { content: wavBase64 },
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        audioChannelCount: 1,
        languageCode: languageCode || "en-US",
        enableAutomaticPunctuation: true,
      },
    } as any);

    const [response] = await operation.promise();

    const transcript =
      (response.results || [])
        .map((r) => r.alternatives?.[0]?.transcript || "")
        .join(" ")
        .trim() || "";

    const title = `Family Memory - ${new Date().toLocaleDateString()}`;

    // Store ONLY transcript (no audio)
    const db = await getDb();
    const result = await db.collection("stories").insertOne({
      title,
      transcript,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: result.insertedId.toString(),
      title,
      transcript,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
