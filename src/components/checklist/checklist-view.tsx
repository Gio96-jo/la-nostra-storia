"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Printer, Search, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PHASES } from "@/lib/constants";
import type { ChecklistItem, ChecklistStatus, TaskCategory, WeddingPhase } from "@/lib/types";
import { ChecklistItemRow } from "./checklist-item-row";
import { AddTaskDialog } from "./add-task-dialog";
import { createClient } from "@/lib/supabase/client";

interface Props {
  weddingId: string;
  initialItems: ChecklistItem[];
}

type StatusFilter = "all" | "open" | "in_progress" | "done";

export function ChecklistView({ weddingId, initialItems }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | TaskCategory>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCat !== "all" && i.category !== filterCat) return false;
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
          !(i.description?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [items, search, filterCat, filterStatus]);

  // "Meest belangrijke to do": urgent-gemarkeerde items + binnenkort achterstallige, niet klaar
  const urgentItems = useMemo(() => {
    const now = Date.now();
    const in7days = now + 7 * 24 * 60 * 60 * 1000;
    return filtered
      .filter((i) => i.status !== "done")
      .filter((i) => {
        if (i.is_urgent) return true;
        if (!i.due_date) return false;
        const due = new Date(i.due_date).getTime();
        return due <= in7days;
      })
      .sort((a, b) => {
        // urgent eerst, daarna op due_date oplopend
        if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1;
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return ad - bd;
      });
  }, [filtered]);

  const urgentIds = useMemo(() => new Set(urgentItems.map((i) => i.id)), [urgentItems]);

  const grouped = useMemo(() => {
    const m = new Map<WeddingPhase, ChecklistItem[]>();
    for (const p of PHASES) m.set(p.value, []);
    for (const item of filtered) {
      if (urgentIds.has(item.id)) continue; // niet dubbel tonen
      m.get(item.phase)?.push(item);
    }
    return m;
  }, [filtered, urgentIds]);

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function patchItem(id: string, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function addItem(item: ChecklistItem) {
    setItems((prev) => [...prev, item]);
  }

  async function changeStatus(id: string, status: ChecklistStatus) {
    const prev = items.find((i) => i.id === id);
    if (!prev) return;
    patchItem(id, { status, is_completed: status === "done" });
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").update({ status }).eq("id", id);
    if (error) {
      patchItem(id, { status: prev.status, is_completed: prev.is_completed });
      toast.error("Bijwerken mislukt", { description: error.message });
    }
  }

  async function toggleUrgent(id: string, value: boolean) {
    patchItem(id, { is_urgent: value });
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").update({ is_urgent: value }).eq("id", id);
    if (error) {
      patchItem(id, { is_urgent: !value });
      toast.error("Bijwerken mislukt", { description: error.message });
    }
  }

  async function changeDueDate(id: string, date: string | null) {
    const prev = items.find((i) => i.id === id);
    if (!prev) return;
    patchItem(id, { due_date: date });
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").update({ due_date: date }).eq("id", id);
    if (error) {
      patchItem(id, { due_date: prev.due_date });
      toast.error("Deadline bijwerken mislukt", { description: error.message });
    } else {
      toast.success("Deadline bijgewerkt");
    }
  }

  async function deleteItem(id: string) {
    const prev = items;
    removeItem(id);
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Taak verwijderd");
    }
  }

  async function saveNotes(id: string, notes: string) {
    patchItem(id, { notes });
    const supabase = createClient();
    await supabase.from("checklist_items").update({ notes }).eq("id", id);
  }

  return (
    <div>
      <PageHeader
        title="Checklist"
        description={`${done} van ${total} taken voltooid (${pct}%)`}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} className="no-print">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={() => setAdding(true)} className="no-print">
              <Plus className="h-4 w-4" /> Eigen taak
            </Button>
          </>
        }
      />

      <Progress value={pct} className="mb-6 h-2" />

      <div className="no-print mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek in taken..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as "all" | TaskCategory)}>
          <SelectTrigger><SelectValue placeholder="Categorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle taken</SelectItem>
            <SelectItem value="open">Alleen open</SelectItem>
            <SelectItem value="in_progress">Alleen bezig</SelectItem>
            <SelectItem value="done">Alleen klaar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {urgentItems.length > 0 ? (
        <section className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" fill="currentColor" />
              Meest belangrijke to do
            </h2>
            <Badge variant="outline">{urgentItems.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Taken die als urgent zijn gemarkeerd of binnen 7 dagen moeten gebeuren.
          </p>
          <div className="space-y-2">
            {urgentItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onStatusChange={(s) => changeStatus(item.id, s)}
                onUrgentToggle={(v) => toggleUrgent(item.id, v)}
                onDueDateChange={(d) => changeDueDate(item.id, d)}
                onDelete={() => deleteItem(item.id)}
                onNotesSave={(n) => saveNotes(item.id, n)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-8">
        {PHASES.map((phase) => {
          const list = grouped.get(phase.value) ?? [];
          if (list.length === 0) return null;
          const phaseDone = list.filter((i) => i.status === "done").length;
          return (
            <section key={phase.value} className="print-break-inside-avoid">
              <div className="flex items-end justify-between mb-3 border-b pb-2">
                <h2 className="font-serif text-xl font-semibold">{phase.label}</h2>
                <Badge variant="outline">{phaseDone}/{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onStatusChange={(s) => changeStatus(item.id, s)}
                    onUrgentToggle={(v) => toggleUrgent(item.id, v)}
                    onDueDateChange={(d) => changeDueDate(item.id, d)}
                    onDelete={() => deleteItem(item.id)}
                    onNotesSave={(n) => saveNotes(item.id, n)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Geen taken gevonden met deze filters.</p>
        ) : null}
      </div>

      <AddTaskDialog open={adding} onOpenChange={setAdding} weddingId={weddingId} onCreated={addItem} />
    </div>
  );
}
