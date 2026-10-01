import { ZodError } from "zod";
import { AiServiceError } from "@/lib/ai/client";
import { analyzeCareer } from "@/lib/ai/analyze-career";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { CareerAnalysisModel } from "@/lib/db/models/CareerAnalysis";
import { ResumeModel } from "@/lib/db/models/Resume";
import { getLlmConfig } from "@/lib/env";
import { analysisCreateResponseSchema, analysisListResponseSchema, analysisRequestSchema, careerAnalysisResultSchema } from "@/lib/validation/schemas";
import { jsonError, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to view your analysis history.", 401);
  try {
    await connectToDatabase();
    const analyses = await CareerAnalysisModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("roleTitle company alignment createdAt")
      .lean();
    return jsonResponse(analysisListResponseSchema, { analyses: analyses.map((analysis) => ({
      id: String(analysis._id),
      roleTitle: analysis.roleTitle,
      company: analysis.company,
      alignment: analysis.alignment,
      createdAt: analysis.createdAt.toISOString(),
    })) });
  } catch (error) {
    console.error("Analysis history failed", error);
    return jsonError("We could not load your analysis history.", 500);
  }
}

export async function POST(request: Request) {
  const ownerId = await getAuthenticatedUserId();
  if (!ownerId) return jsonError("Sign in to create an analysis.", 401);

  let input: ReturnType<typeof analysisRequestSchema.parse>;
  try {
    input = analysisRequestSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof ZodError ? "Add a valid resume and job description." : "Invalid JSON body.";
    return jsonError(message, 400);
  }

  try {
    getLlmConfig();
  } catch {
    return jsonError("AI analysis is not configured yet. Add the LLM settings to the server environment.", 503);
  }

  try {
    await connectToDatabase();
    const resume = await ResumeModel.findOne({ _id: input.resumeId, ownerId }).select("extractedText").lean();
    if (!resume) return jsonError("That resume could not be found in your account.", 404);

    const analyzed = await analyzeCareer(resume.extractedText, input.jobDescription);
    const result = careerAnalysisResultSchema.parse(analyzed.result);
    const analysis = await CareerAnalysisModel.create({
      ownerId,
      resumeId: resume._id,
      roleTitle: result.role.roleTitle,
      company: result.role.company,
      jobDescription: input.jobDescription,
      alignment: analyzed.alignment,
      result,
      schemaVersion: 1,
    });
    return jsonResponse(analysisCreateResponseSchema, { analysis: { id: analysis.id, roleTitle: analysis.roleTitle, company: analysis.company, alignment: analysis.alignment } }, 201);
  } catch (error) {
    if (error instanceof AiServiceError) return jsonError(error.message, 502);
    console.error("Career analysis failed", error);
    return jsonError("We could not complete this analysis. Please try again.", 500);
  }
}