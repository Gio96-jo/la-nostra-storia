import { getCurrentWedding } from "@/lib/wedding";
import { NotesView } from "@/components/notes/notes-view";
import type { Photo } from "@/lib/types";

export const metadata = { title: "Notities & inspiratie" };

export default async function NotesPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const [{ data: notes }, { data: photos }] = await Promise.all([
    supabase
      .from("notes")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("photos")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("source_type", "note")
      .order("uploaded_at", { ascending: false }),
  ]);

  return (
    <NotesView
      weddingId={wedding.id}
      initial={notes ?? []}
      initialPhotos={(photos ?? []) as Photo[]}
    />
  );
}
