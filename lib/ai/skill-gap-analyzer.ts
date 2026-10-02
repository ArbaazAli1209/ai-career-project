import "server-only";
import { generateStructured } from "@/lib/ai/client";
import {
  createSkillGapAiResponseSchema,
  skillGapAnalysisSchema,
  type JobAnalysis,
  type ResumeAnalysis,
  type SkillGapAnalysis,
  type SkillMatch,
} from "@/lib/validation/schemas";

const synonymGroups = [
  ["javascript", "js", "ecmascript"],
  ["typescript", "ts"],
  ["postgresql", "postgres", "sql"],
  ["amazon web services", "aws"],
  ["google cloud platform", "gcp"],
  ["machine learning", "ml"],
  ["artificial intelligence", "ai"],
  ["user experience", "ux"],
  ["user interface", "ui"],
];

function normalizeSkill(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
  return synonymGroups.find((group) => group.includes(normalized))?.[0] ?? normalized;
}

function categoryFor(skill: string) {
  const normalized = normalizeSkill(skill);
  if (/communication|leadership|collaboration|writing|presentation|teamwork/.test(normalized)) return "People";
  if (/testing|analytics|research|design|product|project management/.test(normalized)) return "Practice";
  return "Technical";
}

function toSkillMatch(
  group: SkillGapAnalysis["matchedSkills"] | SkillGapAnalysis["partialMatches"] | SkillGapAnalysis["missingSkills"],
  status: SkillMatch["status"],
): SkillMatch[] {
  return group.map((skill) => ({
    name: skill.name,
    category: skill.category,
    status,
    evidence: "resumeEvidence" in skill
      ? [skill.resumeEvidence, "missingEvidence" in skill ? skill.missingEvidence : "", skill.explanation].filter(Boolean).join(" ").slice(0, 240)
      : skill.explanation.slice(0, 240),
  }));
}

export async function analyzeSkillGaps(resume: ResumeAnalysis, role: JobAnalysis) {
  const roleRequirements = role.roleRequirements.length
    ? role.roleRequirements
    : role.requiredSkills.map((name) => ({
      name,
      description: `Required skill: ${name}`,
      category: categoryFor(name) as "Technical" | "People" | "Other",
      importance: "required" as const,
    }));
  const responseSchema = createSkillGapAiResponseSchema(roleRequirements.map((requirement) => requirement.name));
  const aiResult = await generateStructured(
    "Compare the structured resume with the structured job requirements. Classify every requirement exactly once as matchedSkills, partialMatches, or missingSkills, using its exact requirement name and category. Cite only specific supplied resume evidence. A matched item has clear evidence for the requirement; a partial match has related but incomplete evidence and states what evidence is missing; a missing item has no supporting resume evidence. Do not treat absence from a resume as proof the person lacks a skill. Estimate alignment from the overall evidence and requirement importance, as an integer from 0 to 100. Include at least one concise overall explanation. Do not add requirements or skills that were not supplied. Return only the validated fields.",
    JSON.stringify({ resume, roleRequirements }),
    responseSchema,
  );
  const skillGapAnalysis = skillGapAnalysisSchema.parse({ ...aiResult, roleRequirements });
  const skills: SkillMatch[] = [
    ...toSkillMatch(skillGapAnalysis.matchedSkills, "matched"),
    ...toSkillMatch(skillGapAnalysis.partialMatches, "partial"),
    ...toSkillMatch(skillGapAnalysis.missingSkills, "missing"),
  ];
  return {
    skillGapAnalysis,
    skills,
    alignment: skillGapAnalysis.estimatedAlignment,
  };
}