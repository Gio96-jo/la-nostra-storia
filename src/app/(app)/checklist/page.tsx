import { getCurrentWedding } from "@/lib/wedding";
import { ChecklistView } from "@/components/checklist/checklist-view";

export const metadata = { title: "Checklist" };

export default async function ChecklistPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("phase", { ascending: true })
    .order("sort_order", { ascending: true });

  return <ChecklistView weddingId={wedding.id} initialItems={items ?? []} />;
}
