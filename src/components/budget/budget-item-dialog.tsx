"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { BudgetItem, TaskCategory } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weddingId: string;
  suppliers: { id: string; name: string }[];
  editing: BudgetItem | null;
  onSaved: (item: BudgetItem) => void;
}

export function BudgetItemDialog({ open, onOpenChange, weddingId, suppliers, editing, onSaved }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("overig");
  const [estimated, setEstimated] = useState("");
  const [actual, setActual] = useState("");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(editing?.description ?? "");
      setCategory(editing?.category ?? "overig");
      setEstimated(editing?.estimated_cost?.toString() ?? "");
      setActual(editing?.actual_cost?.toString() ?? "");
      setSupplierId(editing?.supplier_id ?? "none");
      setIsPaid(editing?.is_paid ?? false);
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { toast.error("Geef een omschrijving op"); return; }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      description: description.trim(),
      category,
      estimated_cost: Number(estimated || 0),
      actual_cost: actual ? Number(actual) : null,
      supplier_id: supplierId === "none" ? null : supplierId,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString().split("T")[0] : null,
      notes: notes.trim() || null,
    };

    const { data, error } = editing
      ? await supabase.from("budget_items").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("budget_items").insert(payload).select().single();

    setLoading(false);
    if (error || !data) { toast.error("Opslaan mislukt", { description: error?.message }); return; }
    onSaved(data as BudgetItem);
    toast.success(editing ? "Post bijgewerkt" : "Post toegevoegd");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Budgetpost bewerken" : "Nieuwe budgetpost"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desc">Omschrijving</Label>
            <Input id="desc" required value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Leverancier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Geen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="est">Geschatte kosten (€)</Label>
              <Input id="est" type="number" min={0} step="0.01" value={estimated} onChange={(e) => setEstimated(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="act">Werkelijke kosten (€)</Label>
              <Input id="act" type="number" min={0} step="0.01" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="paid" checked={isPaid} onCheckedChange={(v) => setIsPaid(!!v)} />
            <Label htmlFor="paid" className="cursor-pointer">Betaald</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
