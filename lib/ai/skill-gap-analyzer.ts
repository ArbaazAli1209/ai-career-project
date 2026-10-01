import "server-only";
import type { JobAnalysis, ResumeAnalysis, SkillMatch } from "@/lib/validation/schemas";

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

function matchEvidence(requiredSkill: string, resumeSkills: string[]) {
  const target = normalizeSkill(requiredSkill);
  const exact = resumeSkills.find((skill) => normalizeSkill(skill) === target);
  if (exact) return { status: "matched" as const, evidence: `Listed on your resume as ${exact}.` };

  const targetWords = new Set(target.split(" ").filter((word) => word.length > 2));
  const candidate = resumeSkills
    .map((skill) => ({ skill, overlap: [...targetWords].filter((word) => normalizeSkill(skill).includes(word)).length }))
    .sort((a, b) => b.overlap - a.overlap)[0];
  if (candidate && candidate.overlap > 0 && candidate.overlap >= Math.ceil(targetWords.size / 2)) {
    return { status: "partial" as const, evidence: `Related experience appears as ${candidate.skill}; add specific evidence for ${requiredSkill}.` };
  }
  return { status: "missing" as const, evidence: "No direct evidence found in the resume text." };
}

export function analyzeSkillGaps(resume: ResumeAnalysis, role: JobAnalysis) {
  const skills: SkillMatch[] = role.requiredSkills.map((name) => {
    const evidence = matchEvidence(name, resume.skills);
    return { name, category: categoryFor(name), ...evidence };
  });
  const weighted = skills.reduce((total, skill) => total + (skill.status === "matched" ? 1 : skill.status === "partial" ? 0.5 : 0), 0);
  const alignment = skills.length === 0 ? 0 : Math.round((weighted / skills.length) * 100);
  return { skills, alignment };
}