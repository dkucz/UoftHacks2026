import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import type { Document } from "mongodb";

export const runtime = "nodejs"; // important: we need fs access

function safeExtFromMime(mime: string) {
  if (mime === "audio/webm") return "webm";
  if (mime === "audio/wav") return "wav";
  if (mime === "audio/mpeg") return "mp3";
  if (mime === "audio/mp4") return "m4a";
  if (mime === "audio/ogg") return "ogg";
  return "bin";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("audio");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file (field name: 'audio')" }, { status: 400 });
    }

    const title = String(form.get("title") ?? "").trim();
    const speakerName = String(form.get("speakerName") ?? "").trim();

    // sessionId can come from header or form
    const headerSessionId = req.headers.get("x-session-id")?.trim();
    const bodySessionId = String(form.get("sessionId") ?? "").trim();
    const sessionId = headerSessionId || bodySessionId || randomUUID();

    // Save file to /uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = safeExtFromMime(file.type);
    const audioId = randomUUID();
    const filename = `${audioId}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buf);

    // Create recording doc in Mongo
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

    const recording: Document = {
      sessionId,
      title: title || "Untitled recording",
      speakerName: speakerName || null,

      // local storage pointer for hackathon
      audioPath: `uploads/${filename}`,
      audioMimeType: file.type || null,
      audioSizeBytes: buf.length,

      status: "uploaded", // option B: separate transcribe step
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("recordings").insertOne(recording);

    return NextResponse.json({
      ok: true,
      sessionId,
      recordingId: result.insertedId,
      status: "uploaded",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const sessionId = req.headers.get("x-session-id")?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing x-session-id header" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

    const recordings = await db
      .collection("recordings")
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ ok: true, recordings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}