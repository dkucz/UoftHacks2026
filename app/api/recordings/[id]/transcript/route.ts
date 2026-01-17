import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Document } from "mongodb";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  const recording = await db.collection<Document>("recordings").findOne({ _id: new ObjectId(id) });
  if (!recording) return NextResponse.json({ error: "Recording not found" }, { status: 404 });

  if (!recording.transcriptId) {
    return NextResponse.json({ ok: true, status: recording.status, transcript: "" });
  }

  const transcript = await db.collection<Document>("transcripts").findOne({ _id: recording.transcriptId });
  return NextResponse.json({ ok: true, transcript: transcript?.text ?? "" });
}
