import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { WorkspaceSidebar } from "@/components/workspace/sidebar";
import { authOptions } from "@/lib/auth/options";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");
  return <div className="workspace-layout"><WorkspaceSidebar name={session.user.name ?? "Student"} /><main className="workspace-main">{children}</main></div>;
}