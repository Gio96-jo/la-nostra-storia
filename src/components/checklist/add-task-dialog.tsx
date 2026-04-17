"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES, PHASES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, TaskCategory, WeddingPhase } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  onCreated: (item: ChecklistItem) => void;
}

export function AddTaskDialog({ open, onOpenChange, weddingId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("overig");
  const [phase, setPhase] = useState<WeddingPhase>("een_tot_drie_maanden");
  const [dueDate, setDueDate] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle(""); setDescription(""); setCategory("overig");
    setPhase("een_tot_drie_maanden"); setDueDate(""); setIsUrgent(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Geef een titel op"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        wedding_id: weddingId,
        title: title.trim(),
        description: description.trim() || null,
        category, phase,
        due_date: dueDate || null,
        is_custom: true,
        sort_order: 9999,
        is_urgent: isUrgent,
      })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("Toevoegen mislukt", { description: error?.message });
      return;
    }
    onCreated(data as ChecklistItem);
    toast.success("Taak toegevoegd");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe taak</DialogTitle>
          <DialogDescription>Voeg een eigen taak toe aan jullie checklist.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Omschrijving</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <Label>Fase</Label>
              <Select value={phase} onValueChange={(v) => setPhase(v as WeddingPhase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Deadline</Label>
            <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(v) => setIsUrgent(!!v)} />
            <Label htmlFor="urgent" className="cursor-pointer">Markeer als urgent (verschijnt bovenaan)</Label>
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
