import { getCurrentWedding } from "@/lib/wedding";
import { SeatingView } from "@/components/seating/seating-view";
import type { Guest, SeatingTable } from "@/lib/types";

export const metadata = { title: "Tafelindeling" };

export default async function TafelindelingPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const [tablesRes, guestsRes] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("first_name", { ascending: true }),
  ]);

  return (
    <SeatingView
      weddingId={wedding.id}
      initialTables={(tablesRes.data ?? []) as SeatingTable[]}
      initialGuests={(guestsRes.data ?? []) as Guest[]}
    />
  );
}
