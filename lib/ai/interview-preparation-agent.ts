import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { interviewQuestionSchema, type JobAnalysis, type ResumeAnalysis } from "@/lib/validation/schemas";
import { z } from "zod";

const questionsSchema = z.object({
  technical: z.array(interviewQuestionSchema).min(1).max(8),
  behavioral: z.array(interviewQuestionSchema).min(1).max(8),
  resumeSpecific: z.array(interviewQuestionSchema).min(1).max(8),
});

export function prepareInterview(resume: ResumeAnalysis, role: JobAnalysis) {
  return generateStructured(
    "Prepare a student for the supplied role. Create distinct technical, behavioral, and resume-specific questions. For each include the question, whyItMatters, and an answerApproach, not a fabricated personal answer. Return one JSON object with those three arrays.",
    JSON.stringify({ resumeSummary: resume.summary, experience: resume.experienceHighlights, targetRole: role.roleTitle, responsibilities: role.responsibilities, requiredSkills: role.requiredSkills }),
    questionsSchema,
  );
}