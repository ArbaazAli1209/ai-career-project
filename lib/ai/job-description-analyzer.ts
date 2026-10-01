import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { jobAnalysisSchema, type JobAnalysis } from "@/lib/validation/schemas";

export function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
  return generateStructured(
    "Analyze the supplied job description. Extract the role, company if present, seniority, concrete required skills, and responsibilities. Do not invent requirements. Use Not specified when the company is absent.",
    JSON.stringify({ jobDescription: jobDescription.slice(0, 20_000) }),
    jobAnalysisSchema,
  );
}