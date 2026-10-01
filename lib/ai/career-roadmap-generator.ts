import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { roadmapItemSchema, type JobAnalysis, type ResumeAnalysis, type SkillMatch } from "@/lib/validation/schemas";
import { z } from "zod";

const roadmapSchema = z.array(roadmapItemSchema).min(1).max(8);

export function generateCareerRoadmap(resume: ResumeAnalysis, role: JobAnalysis, skills: SkillMatch[]) {
  return generateStructured(
    "Create a practical, sequenced learning roadmap for a student. Prioritize missing and partial skills, use achievable weekly actions, and define observable outcomes. Return a JSON array of roadmap items with week, focus, actions, and outcome.",
    JSON.stringify({ currentSkills: resume.skills, targetRole: role.roleTitle, requiredSkills: role.requiredSkills, gaps: skills.filter((skill) => skill.status !== "matched") }),
    roadmapSchema,
  );
}