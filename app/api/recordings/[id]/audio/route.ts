import clientPromise from "@/lib/mongodb";
import { ObjectId, type Document } from "mongodb";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return new Response("Invalid id", { status: 400 });

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "living_dictionary");
  const recording = await db.collection<Document>("recordings").findOne({ _id: new ObjectId(id) });

  if (!recording?.audioPath) return new Response("Not found", { status: 404 });

  const absPath = path.join(process.cwd(), String(recording.audioPath));
  const data = await fs.readFile(absPath);

  return new Response(data, {
    headers: {
      "Content-Type": recording.audioMimeType || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}