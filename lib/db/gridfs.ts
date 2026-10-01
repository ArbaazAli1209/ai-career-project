import "server-only";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/db/connect";

async function getBucket() {
  await connectToDatabase();
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB database connection is unavailable.");
  return new GridFSBucket(database, { bucketName: "resumes" });
}

export async function savePdfToGridFs(fileName: string, ownerId: string, contents: Buffer) {
  const bucket = await getBucket();
  const stream = bucket.openUploadStream(fileName, {
    metadata: { ownerId, contentType: "application/pdf" },
  });
  await new Promise<void>((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
    stream.end(contents);
  });
  return stream.id as ObjectId;
}

export async function deletePdfFromGridFs(fileId: ObjectId) {
  const bucket = await getBucket();
  await bucket.delete(fileId);
}

export async function openPdfFromGridFs(fileId: ObjectId) {
  const bucket = await getBucket();
  return bucket.openDownloadStream(fileId);
}