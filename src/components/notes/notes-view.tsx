"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink, GripVertical, MoreVertical, NotebookPen, Pencil, Pin, PinOff,
  Plus, Star, Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { Note, Photo } from "@/lib/types";
import { formatDateNL, cn } from "@/lib/utils";
import { NoteDialog } from "./note-dialog";
import { PhotoGallery } from "@/components/photos/photo-gallery";

interface Props { weddingId: string; initial: Note[]; initialPhotos: Photo[]; }

export function NotesView({ weddingId, initial, initialPhotos }: Props) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  function photosForNote(noteId: string) {
    return photos.filter((p) => p.source_id === noteId);
  }

  function setPhotosForNote(noteId: string, next: Photo[]) {
    setPhotos((prev) => [
      ...prev.filter((p) => p.source_id !== noteId),
      ...next,
    ]);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function upsert(n: Note) {
    setNotes((prev) => {
      const i = prev.findIndex((x) => x.id === n.id);
      if (i === -1) return [n, ...prev];
      const copy = prev.slice();
      copy[i] = n;
      // Als deze als "belangrijk" werd gemarkeerd, zet andere op false (UI-sync met DB)
      if (n.is_important) {
        return copy.map((x) => (x.id === n.id ? x : { ...x, is_important: false }));
      }
      return copy;
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

  async function toggleImportant(n: Note) {
    const next = !n.is_important;
    const supabase = createClient();
    if (next) {
      // Zet andere op false
      await supabase
        .from("notes")
        .update({ is_important: false })
        .eq("wedding_id", weddingId)
        .eq("is_important", true);
      setNotes((prev) => prev.map((x) => ({ ...x, is_important: x.id === n.id })));
    } else {
      setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_important: false } : x)));
    }
    const { error } = await supabase.from("notes").update({ is_important: next }).eq("id", n.id);
    if (error) {
      toast.error("Bijwerken mislukt", { description: error.message });
    } else {
      toast.success(next ? "Gemarkeerd als belangrijkste" : "Niet meer belangrijkste");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(notes, oldIndex, newIndex);
    setNotes(reordered);

    // Sla nieuwe volgorde op in DB
    const supabase = createClient();
    const updates = reordered.map((n, idx) =>
      supabase.from("notes").update({ sort_order: idx + 1 }).eq("id", n.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("Volgorde opslaan mislukt", { description: failed.error.message });
    }
  }

  return (
    <div>
      <PageHeader
        title="Notities & inspiratie"
        description="Sleep notities om ze te herordenen. Maak er één als 'belangrijkste' om op je dashboard te zien."
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={notes.map((n) => n.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((n) => (
                <SortableNoteCard
                  key={n.id}
                  note={n}
                  weddingId={weddingId}
                  photos={photosForNote(n.id)}
                  onPhotosChange={(next) => setPhotosForNote(n.id, next)}
                  onEdit={() => { setEditing(n); setDialogOpen(true); }}
                  onDelete={() => deleteNote(n.id)}
                  onTogglePin={() => togglePin(n)}
                  onToggleImportant={() => toggleImportant(n)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

function SortableNoteCard({
  note, weddingId, photos, onPhotosChange, onEdit, onDelete, onTogglePin, onToggleImportant,
}: {
  note: Note;
  weddingId: string;
  photos: Photo[];
  onPhotosChange: (next: Photo[]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleImportant: () => void;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: note.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn(
        "card-hover h-full",
        note.is_important && "ring-2 ring-amber-400/60 bg-amber-50/50"
      )}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 min-w-0">
              <button
                type="button"
                className="shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
                aria-label="Versleep notitie"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <h3 className="font-serif text-lg font-semibold leading-tight">
                {note.is_important ? (
                  <Star className="inline h-3.5 w-3.5 text-amber-500 mr-1" fill="currentColor" />
                ) : null}
                {note.pinned ? <Pin className="inline h-3.5 w-3.5 text-primary mr-1" fill="currentColor" /> : null}
                {note.title}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggleImportant}>
                  <Star className="h-4 w-4" fill={note.is_important ? "currentColor" : "none"} />
                  {note.is_important ? "Niet meer belangrijkste" : "Als belangrijkste markeren"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePin}>
                  {note.pinned ? <><PinOff className="h-4 w-4" /> Losmaken</> : <><Pin className="h-4 w-4" /> Vastmaken</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4" /> Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {note.content ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{note.content}</p>
          ) : null}
          {note.link_url ? (
            <a
              href={note.link_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline truncate"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{note.link_url.replace(/^https?:\/\//, "")}</span>
            </a>
          ) : null}
          <PhotoGallery
            weddingId={weddingId}
            sourceType="note"
            sourceId={note.id}
            photos={photos}
            onPhotosChange={onPhotosChange}
            compact
          />
          <p className="text-xs text-muted-foreground pt-2 border-t">{formatDateNL(note.created_at)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
