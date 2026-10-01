import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { UploadChunkModel, UploadSessionModel } from "@/lib/db/models/UploadSession";
import { uploadChunkSize } from "@/lib/resume/upload-config";
import { BodyTooLargeError, readLimitedBody } from "@/lib/resume/read-limited-body";
import { jsonError, jsonResponse } from "@/lib/http";
import { uploadChunkResponseSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ uploadId: string; index: string }> }) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to upload a resume.", 401);
  const { uploadId, index: indexText } = await context.params;
  if (!Types.ObjectId.isValid(uploadId)) return jsonError("Upload session not found.", 404);
  const index = Number(indexText);
  if (!Number.isSafeInteger(index) || index < 0) return jsonError("Invalid upload chunk.", 400);

  try {
    await connectToDatabase();
    const session = await UploadSessionModel.findOne({ _id: uploadId, ownerId, status: "open", expiresAt: { $gt: new Date() } }).lean();
    if (!session || index >= session.expectedChunks) return jsonError("Upload session not found.", 404);
    const contents = await readLimitedBody(request, uploadChunkSize);
    const expectedSize = index === session.expectedChunks - 1
      ? session.fileSize - index * uploadChunkSize
      : uploadChunkSize;
    if (contents.length !== expectedSize || contents.length > uploadChunkSize) {
      return jsonError("The uploaded chunk has an invalid size.", 400);
    }
    await UploadChunkModel.updateOne(
      { uploadId: session._id, ownerId, index },
      { $set: { data: contents, expiresAt: session.expiresAt } },
      { upsert: true },
    );
    return jsonResponse(uploadChunkResponseSchema, { received: index });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return jsonError("Upload chunks must be 1 MiB or smaller.", 413);
    console.error("Resume chunk upload failed", error);
    return jsonError("We could not save this part of the upload.", 500);
  }
}