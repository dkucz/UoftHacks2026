import { NextResponse } from "next/server";
import { ObjectId, type Document } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  // 👇 This avoids TS forcing _id to be ObjectId only
  const col = db.collection<Document>("terms");

  // Try ObjectId delete first
  if (ObjectId.isValid(id)) {
    const r1 = await col.deleteOne({ _id: new ObjectId(id) });
    if (r1.deletedCount === 1) {
      return NextResponse.json({ ok: true, deletedAs: "ObjectId" });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
