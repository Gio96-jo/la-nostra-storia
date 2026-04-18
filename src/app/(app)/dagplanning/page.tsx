import { getCurrentWedding } from "@/lib/wedding";
import { DagplanningView } from "@/components/dagplanning/dagplanning-view";
import type { DayScheduleItem } from "@/lib/types";

export const metadata = { title: "Dagplanning" };

export default async function DagplanningPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("day_schedule_items")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("start_time", { ascending: true });

  return (
    <DagplanningView
      weddingId={wedding.id}
      weddingDate={wedding.wedding_date}
      initial={(data ?? []) as DayScheduleItem[]}
    />
  );
}
