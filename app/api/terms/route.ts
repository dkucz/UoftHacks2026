import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  const terms = await db
    .collection("terms")
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({ terms });
}

export async function POST(req: Request) {
  const body = await req.json();
  const term = String(body.term ?? "").trim();
  const definition = String(body.definition ?? "").trim();

  if (!term || !definition) {
    return NextResponse.json(
      { error: "term and definition are required" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");

  const result = await db.collection("terms").insertOne({
    term,
    definition,
    createdAt: new Date(),
  });

  return NextResponse.json({ insertedId: result.insertedId });
}
