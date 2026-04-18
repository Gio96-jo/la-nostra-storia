import { getCurrentWedding } from "@/lib/wedding";
import { DietaryView } from "@/components/dietary/dietary-view";
import type { Guest } from "@/lib/types";

export const metadata = { title: "Dieetoverzicht" };

export default async function DietPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("first_name", { ascending: true });

  return (
    <DietaryView
      guests={(data ?? []) as Guest[]}
      partnerNames={`${wedding.partner_one_name} & ${wedding.partner_two_name}`}
      weddingDate={wedding.wedding_date}
    />
  );
}
