import "server-only";
import { generateStructured } from "@/lib/ai/client";
import { projectSchema, type JobAnalysis, type ResumeAnalysis, type SkillMatch } from "@/lib/validation/schemas";
import { z } from "zod";

const projectsSchema = z.array(projectSchema).min(1).max(6);

export function recommendProjects(resume: ResumeAnalysis, role: JobAnalysis, skills: SkillMatch[]) {
  return generateStructured(
    "Recommend portfolio projects a student can actually complete. Each project should demonstrate skills required for the target role, state a credible level and duration, and avoid claiming completed work. Return a JSON array with title, description, skills, level, and duration.",
    JSON.stringify({ currentSkills: resume.skills, targetRole: role.roleTitle, requiredSkills: role.requiredSkills, gaps: skills.filter((skill) => skill.status !== "matched") }),
    projectsSchema,
  );
}