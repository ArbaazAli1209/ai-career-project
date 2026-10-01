import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, FileSearch } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { CareerAnalysisModel } from "@/lib/db/models/CareerAnalysis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  let analyses: { id: string; roleTitle: string; company: string; alignment: number; createdAt: string }[] = [];
  let unavailable = false;
  try {
    await connectToDatabase();
    const rows = await CareerAnalysisModel.find({ ownerId: session?.user?.id }).sort({ createdAt: -1 }).limit(50).select("roleTitle company alignment createdAt").lean();
    analyses = rows.map((analysis) => ({ id: String(analysis._id), roleTitle: analysis.roleTitle, company: analysis.company, alignment: analysis.alignment, createdAt: analysis.createdAt.toISOString() }));
  } catch (error) {
    console.error("History page load failed", error);
    unavailable = true;
  }

  return (
    <div className="history-page">
      <div className="workspace-topline"><span>YOUR CAREER SPACE</span><span>ANALYSIS HISTORY</span></div>
      <header className="dashboard-heading history-heading"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR PROGRESS, IN VIEW</p><h1>Every role is a <em>new direction.</em></h1><p>Keep track of what you have explored and where your strengths are growing.</p></div><Link className="button button-dark" href="/dashboard">New analysis <ArrowRight size={16} /></Link></header>
      {unavailable && <div className="inline-notice" role="status">We could not load history. Check the MongoDB server configuration and try again.</div>}
      <div className="history-count">{analyses.length} {analyses.length === 1 ? "analysis" : "analyses"} saved</div>
      {analyses.length ? <div className="analysis-list history-list">{analyses.map((analysis) => <Link className="analysis-row" href={`/analysis/${analysis.id}`} key={analysis.id}><span className="analysis-row-icon"><ChartNoAxesCombined size={17} /></span><span className="analysis-row-title"><strong>{analysis.roleTitle}</strong><small>{analysis.company} · {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(analysis.createdAt))}</small></span><span className="alignment-pill">{analysis.alignment}% match</span><ArrowRight size={16} /></Link>)}</div> : <div className="history-empty"><FileSearch size={27} /><h2>No analyses yet</h2><p>Your saved role comparisons and career plans will show up here.</p><Link className="button button-dark" href="/dashboard">Create your first analysis <ArrowRight size={15} /></Link></div>}
    </div>
  );
}