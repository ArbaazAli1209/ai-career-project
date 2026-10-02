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

const optionalResumeText = (max: number) => z.string().trim().max(max).nullish().transform((value) => value || undefined);

export const resumeEducationSchema = z.object({
  institution: cleanText(160),
  degree: optionalResumeText(120),
  fieldOfStudy: optionalResumeText(120),
  startDate: optionalResumeText(40),
  endDate: optionalResumeText(40),
  details: optionalResumeText(500),
}).strict();

export const resumeExperienceSchema = z.object({
  role: cleanText(120),
  organization: cleanText(160),
  location: optionalResumeText(120),
  startDate: optionalResumeText(40),
  endDate: optionalResumeText(40),
  summary: cleanText(500),
  achievements: z.array(cleanText(240)).max(8),
}).strict();

export const resumeProjectSchema = z.object({
  name: cleanText(120),
  description: cleanText(500),
  technologies: z.array(cleanText(80)).max(12),
  url: optionalResumeText(300),
}).strict();

export const resumeCertificationSchema = z.object({
  name: cleanText(160),
  issuer: optionalResumeText(160),
  date: optionalResumeText(40),
  credentialId: optionalResumeText(120),
}).strict();

export const resumeAnalysisSchema = z.object({
  summary: cleanText(1_000),
  education: z.array(resumeEducationSchema).max(20).default([]),
  skills: z.array(cleanText(80)).max(40),
  experience: z.array(resumeExperienceSchema).max(20).default([]),
  projects: z.array(resumeProjectSchema).max(20).default([]),
  certifications: z.array(resumeCertificationSchema).max(30).default([]),
  strengths: z.array(cleanText(240)).max(8).optional(),
  experienceHighlights: z.array(cleanText(240)).max(8).optional(),
}).strict();

export const roleRequirementSchema = z.object({
  name: cleanText(120),
  description: cleanText(240),
  category: z.enum(["Technical", "Experience", "Education", "People", "Other"]),
  importance: z.enum(["required", "preferred"]),
}).strict();

const roleRequirementsSchema = z.array(roleRequirementSchema).max(24).superRefine((requirements, context) => {
  const names = new Set<string>();
  requirements.forEach((requirement, index) => {
    const normalizedName = requirement.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (names.has(normalizedName)) {
      context.addIssue({ code: "custom", path: [index, "name"], message: "Role requirement names must be unique." });
    }
    names.add(normalizedName);
  });
});

export const jobAnalysisSchema = z.object({
  roleTitle: cleanText(120),
  company: z.string().trim().max(120).default("Not specified"),
  seniority: cleanText(80),
  requiredSkills: z.array(cleanText(80)).max(40),
  responsibilities: z.array(cleanText(240)).max(10),
  roleRequirements: roleRequirementsSchema.default([]),
});

export const jobDescriptionAnalyzerOutputSchema = jobAnalysisSchema.extend({
  roleRequirements: roleRequirementsSchema,
}).strict();

export const matchedSkillSchema = z.object({
  name: cleanText(120),
  category: cleanText(60),
  resumeEvidence: cleanText(320),
  explanation: cleanText(300),
}).strict();

export const partialSkillMatchSchema = z.object({
  name: cleanText(120),
  category: cleanText(60),
  resumeEvidence: cleanText(320),
  missingEvidence: cleanText(320),
  explanation: cleanText(300),
}).strict();

export const missingSkillSchema = z.object({
  name: cleanText(120),
  category: cleanText(60),
  explanation: cleanText(300),
}).strict();

export const skillGapExplanationSchema = z.object({
  topic: cleanText(120),
  explanation: cleanText(400),
}).strict();

export const skillGapAnalysisSchema = z.object({
  matchedSkills: z.array(matchedSkillSchema).max(24),
  partialMatches: z.array(partialSkillMatchSchema).max(24),
  missingSkills: z.array(missingSkillSchema).max(24),
  roleRequirements: roleRequirementsSchema,
  estimatedAlignment: z.number().int().min(0).max(100),
  explanations: z.array(skillGapExplanationSchema).min(1).max(12),
}).strict();

export const skillGapAiResponseSchema = skillGapAnalysisSchema.omit({ roleRequirements: true }).strict();

function normalizeRequirementName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

export function createSkillGapAiResponseSchema(requirementNames: string[]) {
  const expected = new Set(requirementNames.map(normalizeRequirementName));
  return skillGapAiResponseSchema.superRefine((result, context) => {
    const seen = new Set<string>();
    const groups = [result.matchedSkills, result.partialMatches, result.missingSkills];
    groups.forEach((group, groupIndex) => {
      group.forEach((skill, skillIndex) => {
        const normalizedName = normalizeRequirementName(skill.name);
        if (!expected.has(normalizedName)) {
          context.addIssue({
            code: "custom",
            path: [["matchedSkills", "partialMatches", "missingSkills"][groupIndex], skillIndex, "name"],
            message: "Each classified skill must match a named role requirement.",
          });
        }
        if (seen.has(normalizedName)) {
          context.addIssue({
            code: "custom",
            path: [["matchedSkills", "partialMatches", "missingSkills"][groupIndex], skillIndex, "name"],
            message: "A role requirement can appear in only one skill group.",
          });
        }
        seen.add(normalizedName);
      });
    });

    expected.forEach((name) => {
      if (!seen.has(name)) {
        context.addIssue({
          code: "custom",
          path: ["missingSkills"],
          message: `The model did not classify the role requirement "${name}".`,
        });
      }
    });
  });
}

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
  skillGapAnalysis: skillGapAnalysisSchema.optional(),
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
export type RoleRequirement = z.infer<typeof roleRequirementSchema>;
export type SkillGapAnalysis = z.infer<typeof skillGapAnalysisSchema>;
export type CareerAnalysisResult = z.infer<typeof careerAnalysisResultSchema>;