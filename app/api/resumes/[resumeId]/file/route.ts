import { Types } from "mongoose";
import { Readable } from "node:stream";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { openPdfFromGridFs } from "@/lib/db/gridfs";
import { ResumeModel } from "@/lib/db/models/Resume";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ resumeId: string }> }) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to view this resume.", 401);
  const { resumeId } = await context.params;
  if (!Types.ObjectId.isValid(resumeId)) return jsonError("Resume not found.", 404);
  try {
    await connectToDatabase();
    const resume = await ResumeModel.findOne({ _id: resumeId, ownerId }).select("fileName size gridFsId").lean();
    if (!resume) return jsonError("Resume not found.", 404);
    const stream = await openPdfFromGridFs(resume.gridFsId);
    const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>;
    return new Response(body, {
      headers: {
        "content-type": "application/pdf",
        "content-length": String(resume.size),
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(resume.fileName)}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Resume download failed", error);
    return jsonError("We could not open this resume.", 500);
  }
}