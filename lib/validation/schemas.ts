import { z } from "zod";
import { maxResumeSize } from "@/lib/resume/upload-config";

const cleanText = (max: number) => z.string().trim().min(1).max(max);

export const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(12).max(128);

export const registrationSchema = z.object({
  name: cleanText(80),
  email: emailSchema,
  password: passwordSchema,
});

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const uploadStartSchema = z.object({
  fileName: cleanText(180).regex(/\.pdf$/i, "Only PDF files are supported."),
  fileSize: z.number().int().positive().max(maxResumeSize),
  contentType: z.literal("application/pdf"),
});

export const analysisRequestSchema = z.object({
  resumeId: z.string().regex(/^[a-f\d]{24}$/i),
  jobDescription: z.string().trim().min(40).max(20_000),
});

export const resumeAnalysisSchema = z.object({
  summary: cleanText(1_000),
  skills: z.array(cleanText(80)).max(40),
  strengths: z.array(cleanText(240)).max(8),
  experienceHighlights: z.array(cleanText(240)).max(8),
});

export const jobAnalysisSchema = z.object({
  roleTitle: cleanText(120),
  company: z.string().trim().max(120).default("Not specified"),
  seniority: cleanText(80),
  requiredSkills: z.array(cleanText(80)).max(40),
  responsibilities: z.array(cleanText(240)).max(10),
});

export const skillMatchSchema = z.object({
  name: cleanText(80),
  category: cleanText(60),
  status: z.enum(["matched", "partial", "missing"]),
  evidence: z.string().trim().max(240),
});

export const roadmapItemSchema = z.object({
  week: z.number().int().min(1).max(16),
  focus: cleanText(100),
  actions: z.array(cleanText(220)).min(1).max(5),
  outcome: cleanText(180),
});

export const projectSchema = z.object({
  title: cleanText(100),
  description: cleanText(500),
  skills: z.array(cleanText(80)).min(1).max(8),
  level: z.enum(["Starter", "Intermediate", "Advanced"]),
  duration: cleanText(60),
});

export const interviewQuestionSchema = z.object({
  question: cleanText(300),
  whyItMatters: cleanText(220),
  answerApproach: cleanText(500),
});

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const isoDateSchema = z.string().datetime();

export const apiErrorResponseSchema = z.object({ error: z.string().min(1).max(300) }).strict();
export const accountResponseSchema = z.object({
  user: z.object({ id: objectIdSchema, name: cleanText(80), email: emailSchema }),
}).strict();
export const resumeSummarySchema = z.object({
  id: objectIdSchema,
  fileName: cleanText(180),
  size: z.number().int().positive().max(15 * 1024 * 1024),
  createdAt: isoDateSchema,
}).strict();
export const resumeListResponseSchema = z.object({ resumes: z.array(resumeSummarySchema) }).strict();
export const uploadSessionResponseSchema = z.object({
  uploadId: objectIdSchema,
  chunkSize: z.number().int().positive(),
  expectedChunks: z.number().int().positive(),
}).strict();
export const uploadChunkResponseSchema = z.object({ received: z.number().int().nonnegative() }).strict();
export const uploadCompleteResponseSchema = z.object({ resume: resumeSummarySchema }).strict();
export const analysisSummarySchema = z.object({
  id: objectIdSchema,
  roleTitle: cleanText(120),
  company: cleanText(120),
  alignment: z.number().min(0).max(100),
  createdAt: isoDateSchema,
}).strict();
export const analysisListResponseSchema = z.object({ analyses: z.array(analysisSummarySchema) }).strict();
export const analysisCreateResponseSchema = z.object({
  analysis: analysisSummarySchema.omit({ createdAt: true }),
}).strict();
export const careerAnalysisResultSchema = z.object({
  resume: resumeAnalysisSchema,
  role: jobAnalysisSchema,
  alignment: z.number().min(0).max(100),
  skills: z.array(skillMatchSchema).max(60),
  roadmap: z.array(roadmapItemSchema).min(1).max(8),
  projects: z.array(projectSchema).min(1).max(6),
  interviews: z.object({
    technical: z.array(interviewQuestionSchema).min(1).max(8),
    behavioral: z.array(interviewQuestionSchema).min(1).max(8),
    resumeSpecific: z.array(interviewQuestionSchema).min(1).max(8),
  }),
});

export const analysisDetailResponseSchema = z.object({
  analysis: analysisSummarySchema.extend({ result: careerAnalysisResultSchema }),
}).strict();

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;
export type SkillMatch = z.infer<typeof skillMatchSchema>;
export type CareerAnalysisResult = z.infer<typeof careerAnalysisResultSchema>;