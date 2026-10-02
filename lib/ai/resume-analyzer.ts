import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { resumeAnalysisSchema, type ResumeAnalysis } from "@/lib/validation/schemas";

export function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  return generateStructured(
    "You are a careful resume analyst. Extract only facts supported by the supplied resume; never invent dates, credentials, metrics, or responsibilities. Return one JSON object with summary (string), education (array of objects with institution, degree, fieldOfStudy, startDate, endDate, details), skills (array of strings), experience (array of objects with role, organization, location, startDate, endDate, summary, achievements array), projects (array of objects with name, description, technologies array, url), and certifications (array of objects with name, issuer, date, credentialId). Always include all six top-level keys and use empty arrays when a section is absent. Omit unknown optional object properties rather than guessing or using null.",
    JSON.stringify({ resumeText: resumeText.slice(0, 25_000) }),
    resumeAnalysisSchema,
  );
}