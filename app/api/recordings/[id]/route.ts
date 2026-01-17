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
  const recordings = db.collection<Document>("recordings");

  const recording = await recordings.findOne({ _id: new ObjectId(id) });
  if (!recording) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, recording });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
  const recordings = db.collection<Document>("recordings");

  const result = await recordings.updateOne(
    { _id: new ObjectId(id) },
    { $set: { title, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, title });
}