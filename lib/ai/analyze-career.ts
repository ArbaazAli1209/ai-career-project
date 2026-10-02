import "server-only";
import { analyzeJobDescription } from "@/lib/ai/job-description-analyzer";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { analyzeSkillGaps } from "@/lib/ai/skill-gap-analyzer";
import { generateCareerRoadmap } from "@/lib/ai/career-roadmap-generator";
import { recommendProjects } from "@/lib/ai/project-recommendation-agent";
import { prepareInterview } from "@/lib/ai/interview-preparation-agent";
import { careerAnalysisResultSchema } from "@/lib/validation/schemas";

export async function analyzeCareer(resumeText: string, jobDescription: string) {
  const [resume, role] = await Promise.all([
    analyzeResume(resumeText),
    analyzeJobDescription(jobDescription),
  ]);
  const { skillGapAnalysis, skills, alignment } = await analyzeSkillGaps(resume, role);
  const [roadmap, projects, interviews] = await Promise.all([
    generateCareerRoadmap(resume, role, skills),
    recommendProjects(resume, role, skills),
    prepareInterview(resume, role),
  ]);

  return {
    alignment,
    result: careerAnalysisResultSchema.parse({ resume, role, alignment, skills, skillGapAnalysis, roadmap, projects, interviews }),
  };
}