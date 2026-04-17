import { getCurrentWedding } from "@/lib/wedding";
import { BudgetView } from "@/components/budget/budget-view";

export const metadata = { title: "Budget" };

export default async function BudgetPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const [{ data: items }, { data: suppliers }] = await Promise.all([
    supabase.from("budget_items").select("*").eq("wedding_id", wedding.id).order("created_at"),
    supabase.from("suppliers").select("id, name").eq("wedding_id", wedding.id).order("name"),
  ]);

  return (
    <BudgetView
      weddingId={wedding.id}
      totalBudget={Number(wedding.estimated_budget ?? 0)}
      initialItems={items ?? []}
      suppliers={suppliers ?? []}
    />
  );
}
