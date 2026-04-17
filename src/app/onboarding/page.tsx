import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata = { title: "Welkom" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing?.onboarding_completed) {
    redirect("/dashboard");
  }

  return <OnboardingWizard userId={user.id} existing={existing ?? null} />;
}
