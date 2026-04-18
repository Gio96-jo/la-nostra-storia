import { getCurrentWedding } from "@/lib/wedding";
import { ChecklistView } from "@/components/checklist/checklist-view";
import type { TaskCategory } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

export const metadata = { title: "Checklist" };

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("phase", { ascending: true })
    .order("sort_order", { ascending: true });

  const catParam = searchParams.cat;
  const initialCat: "all" | TaskCategory =
    catParam && CATEGORIES.some((c) => c.value === catParam)
      ? (catParam as TaskCategory)
      : "all";

  return (
    <ChecklistView
      weddingId={wedding.id}
      initialItems={items ?? []}
      initialCat={initialCat}
    />
  );
}
