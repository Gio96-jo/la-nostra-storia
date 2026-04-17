import { getCurrentWedding } from "@/lib/wedding";
import { NotesView } from "@/components/notes/notes-view";

export const metadata = { title: "Notities & inspiratie" };

export default async function NotesPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return <NotesView weddingId={wedding.id} initial={data ?? []} />;
}
