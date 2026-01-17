import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { Document } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

    const transcripts = await db
      .collection<Document>("transcripts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      transcripts: transcripts.map((t) => ({
        id: String(t._id),
        recordingId: t.recordingId ? String(t.recordingId) : null,
        text: t.cleanText ?? t.text ?? "",
        createdAt: t.createdAt ?? null,
        title: t.title ?? "(missing title)",
      })),
    });
  } catch (err) {
    console.error("GET /api/transcripts error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transcripts" },
      { status: 500 }
    );
  }
}