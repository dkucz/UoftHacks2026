import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Document } from "mongodb";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  const result = await db
    .collection("transcripts")
    .deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // <-- this is recordingId in your frontend

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid recordingId" }, { status: 400 });
  }

  let body: { title?: string };
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");
  const transcripts = db.collection<Document>("transcripts");

  // match transcript by recordingId (not transcript _id)
  const result = await transcripts.updateOne(
    { recordingId: new ObjectId(id) },
    { $set: { title, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Transcript not found for recordingId" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, title });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // recordingId
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid recordingId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");
  const transcripts = db.collection<Document>("transcripts");

  const t = await transcripts.findOne({ recordingId: new ObjectId(id) });
  if (!t) return NextResponse.json({ error: "Transcript not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    title: t.title ?? "Family Story",
    text: t.cleanText ?? t.text ?? "",
  });
}