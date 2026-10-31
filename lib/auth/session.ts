import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function getAuthenticatedUserId() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
  } catch (error) {
    console.error("Session lookup failed", error instanceof Error ? error.message : error);
    return null;
  }
}