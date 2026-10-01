import { Types } from "mongoose";
import { ZodError } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { UploadSessionModel } from "@/lib/db/models/UploadSession";
import { uploadStartSchema, uploadSessionResponseSchema } from "@/lib/validation/schemas";
import { uploadChunkSize } from "@/lib/resume/upload-config";
import { jsonError, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to upload a resume.", 401);
  try {
    const input = uploadStartSchema.parse(await request.json());
    await connectToDatabase();
    const uploadId = new Types.ObjectId();
    const expectedChunks = Math.ceil(input.fileSize / uploadChunkSize);
    await UploadSessionModel.create({
      _id: uploadId,
      ownerId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      expectedChunks,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return jsonResponse(uploadSessionResponseSchema, { uploadId: uploadId.toHexString(), chunkSize: uploadChunkSize, expectedChunks }, 201);
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return jsonError("Choose a valid PDF smaller than 15 MB.", 400);
    console.error("Resume upload session failed", error);
    return jsonError("We could not start the resume upload.", 500);
  }
}