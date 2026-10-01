"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowUpRight, Compass, FileText, LayoutDashboard, LogOut, Sparkles } from "lucide-react";

export function WorkspaceSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/history", label: "Analysis history", icon: FileText },
  ];

  return (
    <aside className="workspace-sidebar">
      <Link className="brand workspace-brand" href="/" aria-label="Northstar home"><span className="brand-mark"><Compass size={18} /></span><span>northstar<span className="brand-period">.</span></span></Link>
      <div className="workspace-nav-label">WORKSPACE</div>
      <nav className="workspace-nav" aria-label="Workspace navigation">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`workspace-nav-link${pathname === href ? " active" : ""}`}><Icon size={17} />{label}</Link>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-coach"><span className="coach-icon"><Sparkles size={16} /></span><strong>Your next step</strong><p>Small, steady progress makes a difference.</p><Link href="/dashboard">Start an analysis <ArrowUpRight size={14} /></Link></div>
      <div className="workspace-account"><span className="avatar">{name.trim().slice(0, 1).toUpperCase() || "S"}</span><span className="account-name">{name}</span><button type="button" aria-label="Sign out" title="Sign out" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={16} /></button></div>
    </aside>
  );
}