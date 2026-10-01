import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { deletePdfFromGridFs, savePdfToGridFs } from "@/lib/db/gridfs";
import { ResumeModel } from "@/lib/db/models/Resume";
import { UploadChunkModel, UploadSessionModel } from "@/lib/db/models/UploadSession";
import { extractPdfText } from "@/lib/resume/parse-pdf";
import { jsonError, jsonResponse } from "@/lib/http";
import { uploadCompleteResponseSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ uploadId: string }> }) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to finish the upload.", 401);
  const { uploadId } = await context.params;
  if (!Types.ObjectId.isValid(uploadId)) return jsonError("Upload session not found.", 404);

  let gridFsId: Types.ObjectId | undefined;
  try {
    await connectToDatabase();
    const session = await UploadSessionModel.findOneAndUpdate(
      { _id: uploadId, ownerId, status: "open", expiresAt: { $gt: new Date() } },
      { $set: { status: "finalizing" } },
      { new: true },
    );
    if (!session) return jsonError("Upload session is missing, expired, or already being processed.", 404);
    const chunks = await UploadChunkModel.find({ uploadId: session._id, ownerId }).sort({ index: 1 }).lean();
    if (chunks.length !== session.expectedChunks || chunks.some((chunk, index) => chunk.index !== index)) {
      await UploadSessionModel.updateOne({ _id: session._id, ownerId }, { $set: { status: "open" } });
      return jsonError("Some parts are missing. Please retry the upload.", 409);
    }
    const contents = Buffer.concat(chunks.map((chunk) => chunk.data));
    if (contents.length !== session.fileSize || contents.subarray(0, 5).toString("ascii") !== "%PDF-") {
      await Promise.all([
        UploadChunkModel.deleteMany({ uploadId: session._id, ownerId }),
        UploadSessionModel.deleteOne({ _id: session._id, ownerId }),
      ]);
      return jsonError("This file is not a valid PDF.", 400);
    }

    gridFsId = await savePdfToGridFs(session.fileName, ownerId, contents);
    let extractedText: string;
    try {
      extractedText = await extractPdfText(contents);
    } catch (error) {
      if (error instanceof Error && error.message.includes("selectable text")) {
        await deletePdfFromGridFs(gridFsId);
        gridFsId = undefined;
        await Promise.all([
          UploadChunkModel.deleteMany({ uploadId: session._id, ownerId }),
          UploadSessionModel.deleteOne({ _id: session._id, ownerId }),
        ]);
        return jsonError(error.message, 422);
      }
      throw error;
    }

    const resume = await ResumeModel.create({
      ownerId,
      fileName: session.fileName,
      size: session.fileSize,
      gridFsId,
      extractedText,
    });
    gridFsId = undefined;
    const cleanup = await Promise.allSettled([
      UploadChunkModel.deleteMany({ uploadId: session._id, ownerId }),
      UploadSessionModel.deleteOne({ _id: session._id, ownerId }),
    ]);
    cleanup.filter((result) => result.status === "rejected").forEach((result) => console.error("Upload staging cleanup failed", result.reason));
    return jsonResponse(uploadCompleteResponseSchema, { resume: { id: resume.id, fileName: resume.fileName, size: resume.size, createdAt: resume.createdAt.toISOString() } }, 201);
  } catch (error) {
    if (gridFsId) await deletePdfFromGridFs(gridFsId).catch((cleanupError) => console.error("GridFS cleanup failed", cleanupError));
    await UploadSessionModel.updateOne({ _id: uploadId, ownerId, status: "finalizing" }, { $set: { status: "open" } }).catch((cleanupError) => console.error("Upload lock cleanup failed", cleanupError));
    console.error("Resume finalization failed", error);
    return jsonError("We could not read this PDF. Try another text-based resume.", 500);
  }
}