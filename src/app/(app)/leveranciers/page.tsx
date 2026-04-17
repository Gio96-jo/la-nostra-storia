import { getCurrentWedding } from "@/lib/wedding";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export const metadata = { title: "Leveranciers" };

export default async function SuppliersPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  return <SuppliersView weddingId={wedding.id} initial={data ?? []} />;
}
