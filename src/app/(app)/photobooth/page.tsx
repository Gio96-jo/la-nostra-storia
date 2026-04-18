import { getCurrentWedding } from "@/lib/wedding";
import { PhotoboothView } from "@/components/photos/photobooth-view";
import type { Photo } from "@/lib/types";

export const metadata = { title: "Photobooth" };

export default async function PhotoboothPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const [{ data: photos }, { data: notes }, { data: tasks }] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("notes").select("id, title").eq("wedding_id", wedding.id),
    supabase.from("checklist_items").select("id, title").eq("wedding_id", wedding.id),
  ]);

  const noteLabels = new Map<string, string>(
    (notes ?? []).map((n: { id: string; title: string }) => [n.id, n.title])
  );
  const taskLabels = new Map<string, string>(
    (tasks ?? []).map((t: { id: string; title: string }) => [t.id, t.title])
  );

  return (
    <PhotoboothView
      weddingId={wedding.id}
      initial={(photos ?? []) as Photo[]}
      noteLabels={Object.fromEntries(noteLabels)}
      taskLabels={Object.fromEntries(taskLabels)}
    />
  );
}
