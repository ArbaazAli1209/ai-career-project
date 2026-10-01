import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, FileText, Plus } from "lucide-react";
import { AnalysisForm } from "@/components/workspace/analysis-form";
import { connectToDatabase } from "@/lib/db/connect";
import { CareerAnalysisModel } from "@/lib/db/models/CareerAnalysis";
import { ResumeModel } from "@/lib/db/models/Resume";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const ownerId = session?.user?.id;
  let resumes: { id: string; fileName: string; createdAt: string }[] = [];
  let analyses: { id: string; roleTitle: string; company: string; alignment: number; createdAt: string }[] = [];
  let dataUnavailable = false;

  try {
    await connectToDatabase();
    const [resumeRows, analysisRows] = await Promise.all([
      ResumeModel.find({ ownerId }).sort({ createdAt: -1 }).select("fileName createdAt").lean(),
      CareerAnalysisModel.find({ ownerId }).sort({ createdAt: -1 }).limit(4).select("roleTitle company alignment createdAt").lean(),
    ]);
    resumes = resumeRows.map((resume) => ({ id: String(resume._id), fileName: resume.fileName, createdAt: resume.createdAt.toISOString() }));
    analyses = analysisRows.map((analysis) => ({ id: String(analysis._id), roleTitle: analysis.roleTitle, company: analysis.company, alignment: analysis.alignment, createdAt: analysis.createdAt.toISOString() }));
  } catch (error) {
    console.error("Dashboard data load failed", error);
    dataUnavailable = true;
  }

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "there";
  const averageAlignment = analyses.length ? Math.round(analyses.reduce((sum, item) => sum + item.alignment, 0) / analyses.length) : null;

  return (
    <div className="dashboard-page">
      <div className="workspace-topline"><span>YOUR CAREER SPACE</span><span>{new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(new Date())}</span></div>
      <header className="dashboard-heading"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> A FRESH PERSPECTIVE</p><h1>Good to see you, <em>{firstName}.</em></h1><p>Bring one opportunity into focus. We will help you find the next right step.</p></div><Link className="button button-dark dashboard-history-link" href="/history">View history <ArrowRight size={16} /></Link></header>
      {dataUnavailable && <div className="inline-notice" role="status">Your workspace is ready, but we could not reach the database. Check the server MongoDB configuration.</div>}
      <section className="overview-stats" aria-label="Career plan overview">
        <div className="overview-stat"><span className="stat-icon"><FileText size={17} /></span><span className="stat-label">Saved resumes</span><strong>{resumes.length}</strong><small>ready to compare</small></div>
        <div className="overview-stat"><span className="stat-icon"><ChartNoAxesCombined size={17} /></span><span className="stat-label">Role analyses</span><strong>{analyses.length}</strong><small>opportunities explored</small></div>
        <div className="overview-stat stat-featured"><span className="stat-icon"><ChartNoAxesCombined size={17} /></span><span className="stat-label">Average alignment</span><strong>{averageAlignment === null ? "—" : `${averageAlignment}%`}</strong><small>{averageAlignment === null ? "Your first role is waiting" : "across recent roles"}</small></div>
      </section>

      <AnalysisForm resumes={resumes} />

      <section className="recent-section">
        <div className="section-title-row"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> KEEP YOUR MOMENTUM</p><h2>Recent role analyses</h2></div><Link href="/history">All history <ArrowRight size={15} /></Link></div>
        {analyses.length ? <div className="analysis-list">{analyses.map((analysis) => <Link className="analysis-row" href={`/analysis/${analysis.id}`} key={analysis.id}><span className="analysis-row-icon"><ChartNoAxesCombined size={17} /></span><span className="analysis-row-title"><strong>{analysis.roleTitle}</strong><small>{analysis.company} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(analysis.createdAt))}</small></span><span className="alignment-pill">{analysis.alignment}% match</span><ArrowRight size={16} /></Link>)}</div> : <div className="empty-history"><span className="empty-icon"><Plus size={20} /></span><div><strong>Your first role analysis is one step away.</strong><p>Paste a job description above and we will help turn it into a practical plan.</p></div></div>}
      </section>
    </div>
  );
}