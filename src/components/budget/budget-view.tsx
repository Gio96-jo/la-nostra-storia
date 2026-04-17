"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import type { BudgetItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { BudgetTable } from "./budget-table";
import { BudgetItemDialog } from "./budget-item-dialog";
import { BudgetChart } from "./budget-chart";

interface SupplierMini { id: string; name: string }

interface Props {
  weddingId: string;
  totalBudget: number;
  initialItems: BudgetItem[];
  suppliers: SupplierMini[];
}

export function BudgetView({ weddingId, totalBudget: initialBudget, initialItems, suppliers }: Props) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [totalBudget, setTotalBudget] = useState(initialBudget);
  const [budgetInput, setBudgetInput] = useState(initialBudget ? String(initialBudget) : "");
  const [savingBudget, setSavingBudget] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);

  const totals = useMemo(() => {
    const spent = items.reduce((s, b) => s + Number(b.actual_cost ?? b.estimated_cost ?? 0), 0);
    const paid = items.filter((b) => b.is_paid).reduce((s, b) => s + Number(b.actual_cost ?? b.estimated_cost ?? 0), 0);
    const unpaid = spent - paid;
    const remaining = totalBudget - spent;
    return { spent, paid, unpaid, remaining };
  }, [items, totalBudget]);

  const overBudget = totalBudget > 0 && totals.spent > totalBudget;
  const usedPct = totalBudget > 0 ? Math.min(100, Math.round((totals.spent / totalBudget) * 100)) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of CATEGORIES) map.set(c.value, 0);
    for (const i of items) {
      const v = Number(i.actual_cost ?? i.estimated_cost ?? 0);
      map.set(i.category, (map.get(i.category) ?? 0) + v);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({
        key,
        label: CATEGORIES.find((c) => c.value === key)?.label ?? key,
        value,
      }))
      .filter((d) => d.value > 0);
  }, [items]);

  async function saveBudget() {
    setSavingBudget(true);
    const supabase = createClient();
    const v = Number(budgetInput || 0);
    const { error } = await supabase
      .from("weddings")
      .update({ estimated_budget: v })
      .eq("id", weddingId);
    setSavingBudget(false);
    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
      return;
    }
    setTotalBudget(v);
    toast.success("Budget bijgewerkt");
  }

  function upsert(item: BudgetItem) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = prev.slice();
      copy[idx] = item;
      return copy;
    });
  }

  async function deleteItem(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("budget_items").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Budgetpost verwijderd");
    }
  }

  async function togglePaid(id: string, value: boolean) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, is_paid: value } : i)));
    const supabase = createClient();
    const { error } = await supabase
      .from("budget_items")
      .update({ is_paid: value, paid_at: value ? new Date().toISOString().split("T")[0] : null })
      .eq("id", id);
    if (error) toast.error("Bijwerken mislukt", { description: error.message });
  }

  return (
    <div>
      <PageHeader
        title="Budget"
        description="Houd grip op de kosten en weet altijd waar jullie staan."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Nieuwe post
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <SummaryCard label="Totaal budget" value={formatCurrency(totalBudget)} />
        <SummaryCard label="Uitgegeven" value={formatCurrency(totals.spent)} warning={overBudget} />
        <SummaryCard label="Resterend" value={formatCurrency(totals.remaining)} warning={totals.remaining < 0} />
        <SummaryCard label="Nog te betalen" value={formatCurrency(totals.unpaid)} />
      </div>

      {/* Budget bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Voortgang</CardTitle>
          <CardDescription>{usedPct}% van het budget besteed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={usedPct} className="h-3" />
          {overBudget && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Jullie zitten {formatCurrency(totals.spent - totalBudget)} boven budget.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget setting */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Totaal budget instellen</CardTitle>
          <CardDescription>Pas het beschikbare budget aan wanneer dat nodig is.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                min={0}
                step={500}
                className="pl-7"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
            </div>
            <Button onClick={saveBudget} disabled={savingBudget}>Opslaan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart + table */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Verdeling per categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nog geen posten toegevoegd.</p>
            ) : (
              <BudgetChart data={byCategory} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alle posten</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Nog geen budgetposten"
                description="Voeg per leverancier of categorie een post toe en houd zo overzicht."
                action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Eerste post</Button>}
                className="m-6"
              />
            ) : (
              <BudgetTable
                items={items}
                suppliers={suppliers}
                onEdit={(i) => { setEditing(i); setDialogOpen(true); }}
                onDelete={deleteItem}
                onTogglePaid={togglePaid}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <BudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weddingId={weddingId}
        suppliers={suppliers}
        editing={editing}
        onSaved={upsert}
      />
    </div>
  );
}

function SummaryCard({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <Card className={warning ? "border-destructive/50" : ""}>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-serif font-semibold ${warning ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
