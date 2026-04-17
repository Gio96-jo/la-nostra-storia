"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SUPPLIER_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Supplier, SupplierStatus, TaskCategory } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weddingId: string;
  editing: Supplier | null;
  onSaved: (s: Supplier) => void;
}

export function SupplierDialog({ open, onOpenChange, weddingId, editing, onSaved }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("overig");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [status, setStatus] = useState<SupplierStatus>("contact_opgenomen");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setCategory(editing?.category ?? "overig");
      setContact(editing?.contact_person ?? "");
      setEmail(editing?.email ?? "");
      setPhone(editing?.phone ?? "");
      setWebsite(editing?.website ?? "");
      setAgreedPrice(editing?.agreed_price?.toString() ?? "");
      setStatus(editing?.status ?? "contact_opgenomen");
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Naam is verplicht"); return; }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      name: name.trim(),
      category,
      contact_person: contact.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      agreed_price: agreedPrice ? Number(agreedPrice) : null,
      status,
      notes: notes.trim() || null,
    };
    const { data, error } = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("suppliers").insert(payload).select().single();
    setLoading(false);
    if (error || !data) { toast.error("Opslaan mislukt", { description: error?.message }); return; }
    onSaved(data as Supplier);
    toast.success(editing ? "Leverancier bijgewerkt" : "Leverancier toegevoegd");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Leverancier bewerken" : "Nieuwe leverancier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SupplierStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contactpersoon</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
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
              <Label htmlFor="web">Website</Label>
              <Input id="web" type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Afgesproken prijs (€)</Label>
              <Input id="price" type="number" min={0} step="0.01" value={agreedPrice} onChange={(e) => setAgreedPrice(e.target.value)} />
            </div>
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
