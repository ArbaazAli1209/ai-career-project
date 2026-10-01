import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined, Compass, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Northstar home">
          <span className="brand-mark"><Compass size={19} strokeWidth={2.3} /></span>
          <span>northstar<span className="brand-period">.</span></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#your-toolkit">Your toolkit</a>
        </nav>
        <div className="header-actions">
          <Link className="text-link" href="/sign-in">Sign in</Link>
          <Link className="button button-dark button-small" href="/register">Get started <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</p>
          <h1 id="hero-title">Make your next<br />move <em>count.</em></h1>
          <p className="hero-copy">A clearer path from where you are to the career you want. Turn your experience into a plan, then show up ready.</p>
          <div className="hero-actions">
            <Link className="button button-lime" href="/register">Build my career plan <ArrowRight size={17} /></Link>
            <Link className="button button-quiet" href="#how-it-works">See how it works <ArrowDown size={16} /></Link>
          </div>
          <div className="hero-footnote"><span className="status-dot" /> Made for the in-between: student to standout.</div>
        </div>
        <div className="hero-index" aria-hidden="true"><span>01</span> / 03</div>
        <div className="hero-side-note" aria-hidden="true">YOUR CAREER, IN FOCUS</div>
      </section>

      <section className="proof-strip" aria-label="What Northstar helps you do">
        <p>One focused place to figure out what comes next.</p>
        <div className="proof-items"><span><ChartNoAxesCombined size={17} /> Know your strengths</span><span><BriefcaseBusiness size={17} /> Build relevant experience</span><span><Sparkles size={17} /> Walk in prepared</span></div>
      </section>

      <section className="toolkit-section" id="your-toolkit">
        <div className="section-heading">
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> A LITTLE MORE DIRECTION</p>
          <h2>Less guesswork.<br /><em>More forward.</em></h2>
        </div>
        <div className="toolkit-grid" id="how-it-works">
          <article className="toolkit-item"><span className="toolkit-number">01</span><div><h3>See the full picture</h3><p>Compare your resume with a real opportunity. Get a grounded view of what already fits and what to strengthen next.</p></div><ArrowUpRight size={19} /></article>
          <article className="toolkit-item"><span className="toolkit-number">02</span><div><h3>Make progress that adds up</h3><p>Turn skill gaps into a paced learning roadmap and portfolio projects that make your next application stronger.</p></div><ArrowUpRight size={19} /></article>
          <article className="toolkit-item"><span className="toolkit-number">03</span><div><h3>Show up ready</h3><p>Practice technical, behavioral, and resume-specific questions built around the role you actually want.</p></div><ArrowUpRight size={19} /></article>
        </div>
      </section>

      <footer className="site-footer"><Link className="brand brand-footer" href="/"><span className="brand-mark"><Compass size={17} /></span><span>northstar<span className="brand-period">.</span></span></Link><span>Make room for what you could become.</span><Link href="/register">Start your plan <ArrowRight size={15} /></Link></footer>
    </main>
  );
}
