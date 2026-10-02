import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { jobDescriptionAnalyzerOutputSchema, type JobAnalysis } from "@/lib/validation/schemas";

export function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
  return generateStructured(
    "Analyze the supplied job description. Extract the role, company if present, seniority, concrete required skills, responsibilities, and up to 24 distinct roleRequirements. Each role requirement must have name, description, category (Technical, Experience, Education, People, or Other), and importance (required or preferred). Include explicit education, experience, and people requirements as well as skills; do not invent requirements. Use Not specified when the company is absent. Return all fields in the requested JSON object.",
    JSON.stringify({ jobDescription: jobDescription.slice(0, 20_000) }),
    jobDescriptionAnalyzerOutputSchema,
  );
}