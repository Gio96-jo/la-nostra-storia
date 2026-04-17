import { getCurrentWedding } from "@/lib/wedding";
import { GuestsView } from "@/components/guests/guests-view";

export const metadata = { title: "Gastenlijst" };

export default async function GuestsPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  return <GuestsView weddingId={wedding.id} initialGuests={guests ?? []} />;
}
