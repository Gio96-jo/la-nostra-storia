import { getCurrentWedding } from "@/lib/wedding";
import { MusicRequestsView } from "@/components/music/music-requests-view";
import type { MusicRequest } from "@/lib/types";

export const metadata = { title: "Muziekwensen" };

export default async function MusicPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("music_requests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  return <MusicRequestsView initial={(data ?? []) as MusicRequest[]} />;
}
