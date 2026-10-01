import { connectToDatabase } from "@/lib/db/connect";
import { ResumeModel } from "@/lib/db/models/Resume";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { resumeListResponseSchema } from "@/lib/validation/schemas";
import { jsonError, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to view resumes.", 401);
  try {
    await connectToDatabase();
    const resumes = await ResumeModel.find({ ownerId }).sort({ createdAt: -1 }).select("fileName size createdAt").lean();
    return jsonResponse(resumeListResponseSchema, { resumes: resumes.map((resume) => ({ id: String(resume._id), fileName: resume.fileName, size: resume.size, createdAt: resume.createdAt.toISOString() })) });
  } catch (error) {
    console.error("Resume list failed", error);
    return jsonError("We could not load your resumes.", 500);
  }
}