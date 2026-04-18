import { getCurrentWedding } from "@/lib/wedding";
import { IdeasView } from "@/components/ideeen/ideas-view";

export const metadata = { title: "Ideeën" };

export default async function IdeeenPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("idea_favorites")
    .select("idea_id")
    .eq("wedding_id", wedding.id);

  const favoriteIds = (data ?? []).map((r: { idea_id: string }) => r.idea_id);

  return (
    <IdeasView
      weddingId={wedding.id}
      initialTheme={wedding.theme}
      initialFavorites={favoriteIds}
    />
  );
}
