import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { resumeAnalysisSchema, type ResumeAnalysis } from "@/lib/validation/schemas";

export function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  return generateStructured(
    "You are a careful resume analyst. Extract only skills and experience supported by the supplied resume. Do not infer credentials or claim impact that is not stated. Return JSON with summary, skills, strengths, and experienceHighlights.",
    JSON.stringify({ resumeText: resumeText.slice(0, 25_000) }),
    resumeAnalysisSchema,
  );
}