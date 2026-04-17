import Link from "next/link";
import { getCurrentWedding } from "@/lib/wedding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownHero } from "@/components/dashboard/countdown-hero";
import { formatCurrency, formatDateNL } from "@/lib/utils";
import { ArrowRight, ListChecks, Wallet, Users, Building2, Calendar } from "lucide-react";
import { CATEGORIES, getCategoryMeta } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { wedding, supabase } = await getCurrentWedding();
  if (!wedding) return null;

  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [
    checklistCount,
    checklistDone,
    monthTasks,
    upcomingTasks,
    budgetItems,
    guestRows,
    suppliersCount,
    recentActivity,
  ] = await Promise.all([
    supabase.from("checklist_items").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
    supabase.from("checklist_items").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("is_completed", true),
    supabase.from("checklist_items").select("id", { count: "exact", head: true })
      .eq("wedding_id", wedding.id).eq("is_completed", false)
      .gte("due_date", todayIso).lte("due_date", monthEnd),
    supabase.from("checklist_items").select("*")
      .eq("wedding_id", wedding.id).eq("is_completed", false)
      .gte("due_date", todayIso).order("due_date", { ascending: true }).limit(5),
    supabase.from("budget_items").select("estimated_cost, actual_cost, is_paid, category").eq("wedding_id", wedding.id),
    supabase.from("guests").select("rsvp_status").eq("wedding_id", wedding.id),
    supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
    supabase.from("checklist_items").select("title, updated_at, is_completed")
      .eq("wedding_id", wedding.id).order("updated_at", { ascending: false }).limit(5),
  ]);

  const totalTasks = checklistCount.count ?? 0;
  const doneTasks = checklistDone.count ?? 0;
  const progressPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const budgetTotal = wedding.estimated_budget ?? 0;
  const budgetSpent = (budgetItems.data ?? []).reduce(
    (sum, b) => sum + Number(b.actual_cost ?? b.estimated_cost ?? 0), 0
  );
  const budgetRemaining = budgetTotal - budgetSpent;
  const budgetUnpaid = (budgetItems.data ?? [])
    .filter((b) => !b.is_paid)
    .reduce((sum, b) => sum + Number(b.actual_cost ?? b.estimated_cost ?? 0), 0);

  const guestsConfirmed = (guestRows.data ?? []).filter((g) => g.rsvp_status === "bevestigd").length;
  const guestsTotal = (guestRows.data ?? []).length;

  return (
    <div className="space-y-6">
      <CountdownHero
        weddingDate={wedding.wedding_date}
        partnerOne={wedding.partner_one_name}
        partnerTwo={wedding.partner_two_name}
        venueName={wedding.venue_name}
        city={wedding.city}
      />

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Voortgang</CardTitle>
              <CardDescription>{doneTasks} van {totalTasks} taken voltooid</CardDescription>
            </div>
            <span className="text-3xl font-serif font-semibold text-primary">{progressPct}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPct} className="h-3" />
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Budget besteed"
          value={formatCurrency(budgetSpent)}
          sub={budgetTotal ? `van ${formatCurrency(budgetTotal)}` : "Nog geen budget ingesteld"}
          warning={budgetTotal > 0 && budgetSpent > budgetTotal}
          href="/budget"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Nog te betalen"
          value={formatCurrency(budgetUnpaid)}
          sub="open posten"
          href="/budget"
        />
        <StatCard
          icon={<ListChecks className="h-4 w-4" />}
          label="Taken deze maand"
          value={String(monthTasks.count ?? 0)}
          sub="open en deadline binnen deze maand"
          href="/checklist"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Bevestigde gasten"
          value={`${guestsConfirmed}`}
          sub={`van ${guestsTotal} uitgenodigd`}
          href="/gasten"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aankomende taken</CardTitle>
              <CardDescription>De eerstvolgende vijf open taken</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/checklist">Bekijk alles <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcomingTasks.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Geen openstaande taken met een deadline. Goed bezig!</p>
            ) : (
              (upcomingTasks.data ?? []).map((t) => {
                const cat = getCategoryMeta(t.category);
                return (
                  <div key={t.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={cat.color}>{cat.label}</Badge>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDateNL(t.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent bijgewerkt</CardTitle>
            <CardDescription>Wat is er als laatste gebeurd?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentActivity.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nog geen activiteit.</p>
            ) : (
              (recentActivity.data ?? []).map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {a.is_completed ? "✓ " : ""}{a.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDateNL(a.updated_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorieën</CardTitle>
          <CardDescription>Spring direct naar een onderwerp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link key={c.value} href={`/checklist?cat=${c.value}`}>
                <Badge className={`${c.color} cursor-pointer hover:opacity-80`}>{c.label}</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, warning, href,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; warning?: boolean; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className={`card-hover ${warning ? "border-destructive/50" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {icon} {label}
          </div>
          <p className={`mt-2 text-2xl font-serif font-semibold ${warning ? "text-destructive" : ""}`}>{value}</p>
          {sub ? <p className="text-xs text-muted-foreground mt-0.5">{sub}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
