import { getCurrentWedding } from "@/lib/wedding";
import { TimelineView } from "@/components/timeline/timeline-view";

export const metadata = { title: "Tijdlijn" };

export default async function TimelinePage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("sort_order", { ascending: true });

  return <TimelineView weddingDate={wedding.wedding_date} items={items ?? []} />;
}
