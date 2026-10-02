import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, BriefcaseBusiness, CircleCheck, CircleDashed, CircleHelp, Lightbulb, Sparkles } from "lucide-react";
import { AlignmentChart } from "@/components/analysis/alignment-chart";
import { InterviewTabs } from "@/components/analysis/interview-tabs";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/db/connect";
import { CareerAnalysisModel } from "@/lib/db/models/CareerAnalysis";
import { careerAnalysisResultSchema } from "@/lib/validation/schemas";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

const statusLabels = { matched: "Already demonstrated", partial: "Build on this", missing: "Opportunity to learn" } as const;
const statusIcons = { matched: CircleCheck, partial: CircleHelp, missing: CircleDashed } as const;

export default async function AnalysisDetailPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  if (!Types.ObjectId.isValid(analysisId)) notFound();
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const analysis = await CareerAnalysisModel.findOne({ _id: analysisId, ownerId: session?.user?.id }).lean();
  if (!analysis) notFound();
  const result = careerAnalysisResultSchema.parse(analysis.result);
  const skillCounts = {
    matched: result.skills.filter((skill) => skill.status === "matched").length,
    partial: result.skills.filter((skill) => skill.status === "partial").length,
    missing: result.skills.filter((skill) => skill.status === "missing").length,
  };
  const skillGapAnalysis = result.skillGapAnalysis;

  return (
      <div className="result-page">
        <div className="workspace-topline"><Link href="/history"><ArrowLeft size={14} /> All analyses</Link><span>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(analysis.createdAt))}</span></div>
        <header className="result-heading"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR ROLE SNAPSHOT</p><h1>{analysis.roleTitle}</h1><p>{analysis.company} <span className="heading-divider">/</span> {result.role.seniority}</p></div><span className="result-pill"><Sparkles size={15} /> Career plan ready</span></header>

        <section className="result-overview">
          <div className="alignment-overview"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> AI-ESTIMATED SKILL ALIGNMENT</p><h2>A strong start<br />with room to <em>grow.</em></h2><p className="alignment-note">An AI estimate based on structured resume evidence and this role&apos;s requirements. It is guidance, not a hiring prediction.</p></div><AlignmentChart alignment={result.alignment} /></div>
          <div className="skill-counts"><div><span className="count-mark matched-mark" /><strong>{skillCounts.matched}</strong><span>Matched</span></div><div><span className="count-mark partial-mark" /><strong>{skillCounts.partial}</strong><span>Partial</span></div><div><span className="count-mark missing-mark" /><strong>{skillCounts.missing}</strong><span>To build</span></div></div>
        </section>

        <section className="result-section skill-section"><div className="result-section-heading"><span className="section-icon"><BookOpenCheck size={18} /></span><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> SKILL LANDSCAPE</p><h2>What the role needs</h2><p>Evidence comes from your resume text. Missing evidence does not mean you lack the skill.</p></div></div>
          <div className="skill-list">{result.skills.map((skill) => { const Icon = statusIcons[skill.status]; return <article className={`skill-row skill-${skill.status}`} key={skill.name}><Icon size={17} /><div className="skill-name"><strong>{skill.name}</strong><small>{skill.category}</small></div><p>{skill.evidence}</p><span className="skill-status-label">{statusLabels[skill.status]}</span></article>; })}</div>
          {!result.skills.length && <p className="empty-inline">The job description did not list specific skills to compare.</p>}
          {skillGapAnalysis && <div className="gap-explanations" aria-label="Alignment explanations">{skillGapAnalysis.explanations.map((item) => <p key={item.topic}><strong>{item.topic}</strong>{item.explanation}</p>)}</div>}
          {skillGapAnalysis?.roleRequirements.length ? <details className="role-requirements"><summary>View {skillGapAnalysis.roleRequirements.length} structured role requirements</summary><ul>{skillGapAnalysis.roleRequirements.map((requirement) => <li key={requirement.name}><span>{requirement.importance === "required" ? "Required" : "Preferred"}</span><strong>{requirement.name}</strong><small>{requirement.description}</small></li>)}</ul></details> : null}
        </section>

        <section className="result-section roadmap-section"><div className="result-section-heading"><span className="section-icon lime-icon"><Lightbulb size={18} /></span><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR NEXT FEW WEEKS</p><h2>A roadmap that moves you forward</h2><p>Small, concrete actions connected to the skills this role values.</p></div></div>
          <div className="roadmap-list">{result.roadmap.map((item) => <article className="roadmap-item" key={item.week}><span className="roadmap-week">WEEK <strong>{String(item.week).padStart(2, "0")}</strong></span><div><h3>{item.focus}</h3><ul>{item.actions.map((action) => <li key={action}>{action}</li>)}</ul><p className="roadmap-outcome"><CircleCheck size={15} /> {item.outcome}</p></div></article>)}</div>
        </section>

        <section className="result-section project-section"><div className="result-section-heading"><span className="section-icon coral-icon"><BriefcaseBusiness size={18} /></span><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> LEARN BY BUILDING</p><h2>Projects worth showing</h2><p>Portfolio ideas that let you practice and demonstrate relevant skills.</p></div></div>
          <div className="project-list">{result.projects.map((project) => <article className="project-item" key={project.title}><div className="project-meta"><span>{project.level}</span><span>{project.duration}</span></div><h3>{project.title}</h3><p>{project.description}</p><div className="project-skills">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>)}</div>
        </section>

        <section className="result-section interview-section"><div className="result-section-heading"><span className="section-icon"><Sparkles size={18} /></span><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> PRACTICE WITH PURPOSE</p><h2>Interview prep, tailored to you</h2><p>Use the answer approaches as a starting point. Your examples should stay your own.</p></div></div><InterviewTabs interviews={result.interviews} /></section>

        <footer className="result-footer"><span>Keep the momentum going.</span><Link className="button button-dark" href="/dashboard">Analyze another role <ArrowRight size={16} /></Link></footer>
      </div>
  );
}