"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Printer, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PHASES, getPhaseMeta } from "@/lib/constants";
import type { ChecklistItem, TaskCategory, WeddingPhase } from "@/lib/types";
import { ChecklistItemRow } from "./checklist-item-row";
import { AddTaskDialog } from "./add-task-dialog";
import { createClient } from "@/lib/supabase/client";

interface Props {
  weddingId: string;
  initialItems: ChecklistItem[];
}

export function ChecklistView({ weddingId, initialItems }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | TaskCategory>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "done">("all");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCat !== "all" && i.category !== filterCat) return false;
      if (filterStatus === "open" && i.is_completed) return false;
      if (filterStatus === "done" && !i.is_completed) return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
          !(i.description?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [items, search, filterCat, filterStatus]);

  const grouped = useMemo(() => {
    const m = new Map<WeddingPhase, ChecklistItem[]>();
    for (const p of PHASES) m.set(p.value, []);
    for (const item of filtered) {
      m.get(item.phase)?.push(item);
    }
    return m;
  }, [filtered]);

  const total = items.length;
  const done = items.filter((i) => i.is_completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function update(id: string, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function add(item: ChecklistItem) {
    setItems((prev) => [...prev, item]);
  }

  async function toggle(id: string, value: boolean) {
    update(id, { is_completed: value });
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").update({ is_completed: value }).eq("id", id);
    if (error) {
      update(id, { is_completed: !value });
      toast.error("Bijwerken mislukt", { description: error.message });
    }
  }

  async function deleteItem(id: string) {
    const prev = items;
    remove(id);
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
    update(id, { notes });
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
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as any)}>
          <SelectTrigger><SelectValue placeholder="Categorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle taken</SelectItem>
            <SelectItem value="open">Alleen open</SelectItem>
            <SelectItem value="done">Alleen afgerond</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8">
        {PHASES.map((phase) => {
          const list = grouped.get(phase.value) ?? [];
          if (list.length === 0) return null;
          const phaseDone = list.filter((i) => i.is_completed).length;
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
                    onToggle={(v) => toggle(item.id, v)}
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

      <AddTaskDialog open={adding} onOpenChange={setAdding} weddingId={weddingId} onCreated={add} />
    </div>
  );
}
