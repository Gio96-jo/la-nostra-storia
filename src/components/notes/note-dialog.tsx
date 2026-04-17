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
import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weddingId: string;
  editing: Note | null;
  onSaved: (n: Note) => void;
}

export function NoteDialog({ open, onOpenChange, weddingId, editing, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setContent(editing?.content ?? "");
      setLink(editing?.link_url ?? "");
      setPinned(editing?.pinned ?? false);
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Titel is verplicht"); return; }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      title: title.trim(),
      content: content.trim() || null,
      link_url: link.trim() || null,
      pinned,
    };
    const { data, error } = editing
      ? await supabase.from("notes").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("notes").insert(payload).select().single();
    setLoading(false);
    if (error || !data) { toast.error("Opslaan mislukt", { description: error?.message }); return; }
    onSaved(data as Note);
    toast.success(editing ? "Notitie bijgewerkt" : "Notitie toegevoegd");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Notitie bewerken" : "Nieuwe notitie"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Inhoud</Label>
            <Textarea id="content" rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Link (optioneel)</Label>
            <Input id="link" type="url" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="pin" checked={pinned} onCheckedChange={(v) => setPinned(!!v)} />
            <Label htmlFor="pin" className="cursor-pointer">Vastmaken bovenaan</Label>
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
