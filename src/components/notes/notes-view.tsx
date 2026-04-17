"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, MoreVertical, NotebookPen, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/lib/types";
import { formatDateNL } from "@/lib/utils";
import { NoteDialog } from "./note-dialog";

interface Props { weddingId: string; initial: Note[]; }

export function NotesView({ weddingId, initial }: Props) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  function upsert(n: Note) {
    setNotes((prev) => {
      const i = prev.findIndex((x) => x.id === n.id);
      const list = i === -1 ? [n, ...prev] : (() => { const c = prev.slice(); c[i] = n; return c; })();
      return list.sort((a, b) =>
        a.pinned === b.pinned
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : a.pinned ? -1 : 1
      );
    });
  }

  async function deleteNote(id: string) {
    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      setNotes(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Notitie verwijderd");
    }
  }

  async function togglePin(n: Note) {
    const next = !n.pinned;
    upsert({ ...n, pinned: next });
    const supabase = createClient();
    await supabase.from("notes").update({ pinned: next }).eq("id", n.id);
  }

  return (
    <div>
      <PageHeader
        title="Notities & inspiratie"
        description="Bewaar ideeën, links naar Pinterest, notities over locaties — alles op één plek."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Nieuwe notitie
          </Button>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nog geen notities"
          description="Begin met het verzamelen van inspiratie en ideeën voor jullie dag."
          action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Eerste notitie</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <Card key={n.id} className="card-hover">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold leading-tight">
                    {n.pinned ? <Pin className="inline h-3.5 w-3.5 text-primary mr-1" fill="currentColor" /> : null}
                    {n.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => togglePin(n)}>
                        {n.pinned ? <><PinOff className="h-4 w-4" /> Losmaken</> : <><Pin className="h-4 w-4" /> Vastmaken</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(n); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" /> Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteNote(n.id)}>
                        <Trash2 className="h-4 w-4" /> Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {n.content ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{n.content}</p>
                ) : null}
                {n.link_url ? (
                  <a
                    href={n.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline truncate"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{n.link_url.replace(/^https?:\/\//, "")}</span>
                  </a>
                ) : null}
                <p className="text-xs text-muted-foreground pt-2 border-t">{formatDateNL(n.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weddingId={weddingId}
        editing={editing}
        onSaved={upsert}
      />
    </div>
  );
}
