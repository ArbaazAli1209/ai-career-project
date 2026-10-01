import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { CareerAnalysisModel } from "@/lib/db/models/CareerAnalysis";
import { analysisDetailResponseSchema, careerAnalysisResultSchema } from "@/lib/validation/schemas";
import { jsonError, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ analysisId: string }> }) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to view this analysis.", 401);
  const { analysisId } = await context.params;
  if (!Types.ObjectId.isValid(analysisId)) return jsonError("Analysis not found.", 404);
  try {
    await connectToDatabase();
    const analysis = await CareerAnalysisModel.findOne({ _id: analysisId, ownerId }).lean();
    if (!analysis) return jsonError("Analysis not found.", 404);
    const result = careerAnalysisResultSchema.parse(analysis.result);
    return jsonResponse(analysisDetailResponseSchema, { analysis: {
      id: String(analysis._id),
      roleTitle: analysis.roleTitle,
      company: analysis.company,
      alignment: analysis.alignment,
      createdAt: analysis.createdAt.toISOString(),
      result,
    } });
  } catch (error) {
    console.error("Analysis detail failed", error);
    return jsonError("We could not load this analysis.", 500);
  }
}