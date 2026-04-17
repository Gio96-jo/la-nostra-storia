import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Wedding } from "@/lib/types";

/**
 * Loads the current user + their wedding workspace.
 * Redirects:
 *   - to /login if no session
 *   - to /onboarding if logged in but no wedding (or onboarding not completed)
 */
export async function getCurrentWedding(opts?: { allowNoWedding?: boolean }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!wedding && !opts?.allowNoWedding) {
    redirect("/onboarding");
  }

  if (wedding && !wedding.onboarding_completed && !opts?.allowNoWedding) {
    redirect("/onboarding");
  }

  return { user, wedding: wedding as Wedding | null, supabase };
}
