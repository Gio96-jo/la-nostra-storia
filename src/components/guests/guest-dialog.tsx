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
import { GUEST_RELATIONS, RSVP_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Guest, GuestRelation, RsvpStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weddingId: string;
  editing: Guest | null;
  onSaved: (g: Guest) => void;
}

export function GuestDialog({ open, onOpenChange, weddingId, editing, onSaved }: Props) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState<GuestRelation>("vrienden");
  const [status, setStatus] = useState<RsvpStatus>("uitgenodigd");
  const [tableGroup, setTableGroup] = useState("");
  const [dietary, setDietary] = useState("");
  const [plusOne, setPlusOne] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFirst(editing?.first_name ?? "");
      setLast(editing?.last_name ?? "");
      setEmail(editing?.email ?? "");
      setPhone(editing?.phone ?? "");
      setRelation(editing?.relation ?? "vrienden");
      setStatus(editing?.rsvp_status ?? "uitgenodigd");
      setTableGroup(editing?.table_group ?? "");
      setDietary(editing?.dietary_wishes ?? "");
      setPlusOne(editing?.plus_one ?? false);
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim()) { toast.error("Voornaam is verplicht"); return; }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      first_name: first.trim(),
      last_name: last.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      relation,
      rsvp_status: status,
      table_group: tableGroup.trim() || null,
      dietary_wishes: dietary.trim() || null,
      plus_one: plusOne,
      notes: notes.trim() || null,
    };
    const { data, error } = editing
      ? await supabase.from("guests").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("guests").insert(payload).select().single();
    setLoading(false);
    if (error || !data) { toast.error("Opslaan mislukt", { description: error?.message }); return; }
    onSaved(data as Guest);
    toast.success(editing ? "Gast bijgewerkt" : "Gast toegevoegd");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Gast bewerken" : "Nieuwe gast"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first">Voornaam *</Label>
              <Input id="first" required value={first} onChange={(e) => setFirst(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Achternaam</Label>
              <Input id="last" value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Relatie</Label>
              <Select value={relation} onValueChange={(v) => setRelation(v as GuestRelation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GUEST_RELATIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RSVP status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RsvpStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RSVP_STATUSES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table">Tafelgroep</Label>
              <Input id="table" placeholder="Bijv. Familie 1" value={tableGroup} onChange={(e) => setTableGroup(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diet">Dieetwensen</Label>
              <Input id="diet" placeholder="Bijv. vegetarisch, glutenvrij" value={dietary} onChange={(e) => setDietary(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="p1" checked={plusOne} onCheckedChange={(v) => setPlusOne(!!v)} />
            <Label htmlFor="p1" className="cursor-pointer">Komt met +1</Label>
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
