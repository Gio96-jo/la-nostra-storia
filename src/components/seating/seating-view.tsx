"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Armchair, CheckCircle2, GripVertical, MoreVertical, Pencil, Plus, Printer,
  Trash2, UserMinus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Guest, SeatingTable, SeatingTableShape } from "@/lib/types";

interface Props {
  weddingId: string;
  initialTables: SeatingTable[];
  initialGuests: Guest[];
}

function fullName(g: Guest): string {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

function guestCountForTable(guests: Guest[], tableId: string): number {
  let n = 0;
  for (const g of guests) {
    if (g.seating_table_id === tableId) {
      n += 1;
      if (g.plus_one) n += 1;
    }
  }
  return n;
}

export function SeatingView({ weddingId, initialTables, initialGuests }: Props) {
  const [tables, setTables] = useState<SeatingTable[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [dragGuestId, setDragGuestId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const [editing, setEditing] = useState<SeatingTable | "new" | null>(null);

  const unassigned = useMemo(
    () => guests.filter((g) => !g.seating_table_id),
    [guests]
  );

  async function assignGuest(guestId: string, tableId: string | null) {
    const prev = guests;
    setGuests((gs) =>
      gs.map((g) => (g.id === guestId ? { ...g, seating_table_id: tableId } : g))
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("guests")
      .update({ seating_table_id: tableId })
      .eq("id", guestId);
    if (error) {
      setGuests(prev);
      toast.error("Kon niet opslaan", { description: error.message });
    }
  }

  async function deleteTable(table: SeatingTable) {
    if (!confirm(`Tafel "${table.name}" verwijderen?`)) return;
    const prevTables = tables;
    const prevGuests = guests;
    setTables((ts) => ts.filter((t) => t.id !== table.id));
    setGuests((gs) =>
      gs.map((g) => (g.seating_table_id === table.id ? { ...g, seating_table_id: null } : g))
    );
    const supabase = createClient();
    const { error } = await supabase.from("seating_tables").delete().eq("id", table.id);
    if (error) {
      setTables(prevTables);
      setGuests(prevGuests);
      toast.error("Kon niet verwijderen", { description: error.message });
    } else {
      toast.success("Tafel verwijderd");
    }
  }

  function onDragStart(guestId: string) {
    return (e: React.DragEvent) => {
      setDragGuestId(guestId);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", guestId);
      } catch {}
    };
  }

  function onDragEnd() {
    setDragGuestId(null);
    setDragOverTableId(null);
    setDragOverUnassigned(false);
  }

  function onTableDrop(tableId: string) {
    return async (e: React.DragEvent) => {
      e.preventDefault();
      const id = dragGuestId ?? e.dataTransfer.getData("text/plain");
      setDragOverTableId(null);
      setDragGuestId(null);
      if (!id) return;
      const guest = guests.find((g) => g.id === id);
      if (!guest) return;
      if (guest.seating_table_id === tableId) return;
      await assignGuest(id, tableId);
    };
  }

  function onUnassignedDrop(e: React.DragEvent) {
    e.preventDefault();
    const id = dragGuestId ?? e.dataTransfer.getData("text/plain");
    setDragOverUnassigned(false);
    setDragGuestId(null);
    if (!id) return;
    const guest = guests.find((g) => g.id === id);
    if (!guest || !guest.seating_table_id) return;
    void assignGuest(id, null);
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Tafelindeling"
          description="Sleep gasten naar een tafel. +1's tellen mee voor de capaciteit."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={() => setEditing("new")} size="sm">
                <Plus className="h-4 w-4" />
                Nieuwe tafel
              </Button>
            </>
          }
        />
      </div>

      {/* Print-only: A4-lijst met tafels + gasten */}
      <div className="hidden print:block">
        <h1 className="font-serif text-3xl font-semibold mb-1">Tafelindeling</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {tables.length} tafels — {guests.filter((g) => g.seating_table_id).length} gasten ingedeeld
        </p>
        <div className="grid grid-cols-2 gap-6">
          {tables.map((t) => {
            const seated = guests.filter((g) => g.seating_table_id === t.id);
            return (
              <div key={t.id} className="break-inside-avoid border rounded-lg p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-serif text-lg font-semibold">{t.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {guestCountForTable(guests, t.id)}/{t.capacity}
                  </span>
                </div>
                {t.notes ? (
                  <p className="text-xs text-muted-foreground mb-2 italic">{t.notes}</p>
                ) : null}
                {seated.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <ol className="text-sm space-y-0.5 list-decimal pl-5">
                    {seated.map((g) => (
                      <li key={g.id}>
                        {fullName(g)}
                        {g.plus_one ? (
                          <span className="text-muted-foreground">
                            {" + "}{g.plus_one_name || "+1"}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="no-print grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Unassigned column */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverUnassigned(true);
          }}
          onDragLeave={() => setDragOverUnassigned(false)}
          onDrop={onUnassignedDrop}
          className={cn(
            "rounded-xl border bg-card p-4 transition-colors",
            dragOverUnassigned && "border-primary bg-primary/5"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Nog in te delen
            </h2>
            <span className="text-xs text-muted-foreground">
              {unassigned.length}
            </span>
          </div>

          {unassigned.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-primary/60 mb-2" />
              <p className="text-xs text-muted-foreground">
                Alle gasten hebben een plek.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {unassigned.map((g) => (
                <GuestChip
                  key={g.id}
                  guest={g}
                  onDragStart={onDragStart(g.id)}
                  onDragEnd={onDragEnd}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Tables grid */}
        <div>
          {tables.length === 0 ? (
            <EmptyState
              icon={Armchair}
              title="Nog geen tafels"
              description="Maak je eerste tafel aan en sleep gasten erop."
              action={
                <Button onClick={() => setEditing("new")}>
                  <Plus className="h-4 w-4" /> Nieuwe tafel
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map((t) => (
                <TableCard
                  key={t.id}
                  table={t}
                  guests={guests}
                  seated={guests.filter((g) => g.seating_table_id === t.id)}
                  count={guestCountForTable(guests, t.id)}
                  isDragOver={dragOverTableId === t.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTableId(t.id);
                  }}
                  onDragLeave={() => setDragOverTableId(null)}
                  onDrop={onTableDrop(t.id)}
                  onGuestDragStart={onDragStart}
                  onGuestDragEnd={onDragEnd}
                  onUnassign={(gid) => assignGuest(gid, null)}
                  onEdit={() => setEditing(t)}
                  onDelete={() => deleteTable(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editing !== null ? (
        <TableDialog
          weddingId={weddingId}
          existing={editing === "new" ? null : editing}
          existingCount={tables.length}
          onClose={() => setEditing(null)}
          onSaved={(t, isNew) => {
            setTables((ts) =>
              isNew ? [...ts, t] : ts.map((x) => (x.id === t.id ? t : x))
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function GuestChip({
  guest, onDragStart, onDragEnd, onUnassign,
}: {
  guest: Guest;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onUnassign?: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing hover:border-primary/40"
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 min-w-0 truncate">
        {fullName(guest)}
        {guest.plus_one ? (
          <span className="ml-1 text-[10px] text-muted-foreground">
            +1{guest.plus_one_name ? ` ${guest.plus_one_name}` : ""}
          </span>
        ) : null}
      </span>
      {onUnassign ? (
        <button
          type="button"
          onClick={onUnassign}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          title="Verwijderen van tafel"
        >
          <UserMinus className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}

function TableCard({
  table, seated, count, isDragOver, onDragOver, onDragLeave, onDrop,
  onGuestDragStart, onGuestDragEnd, onUnassign, onEdit, onDelete,
}: {
  table: SeatingTable;
  guests: Guest[];
  seated: Guest[];
  count: number;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onGuestDragStart: (id: string) => (e: React.DragEvent) => void;
  onGuestDragEnd: () => void;
  onUnassign: (guestId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overCapacity = count > table.capacity;
  return (
    <Card
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "transition-colors",
        isDragOver && "border-primary ring-2 ring-primary/20",
        overCapacity && !isDragOver && "border-destructive/60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold truncate">
              {table.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {table.shape === "round" ? "Rond" : "Rechthoek"}
              {table.notes ? ` — ${table.notes}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                overCapacity
                  ? "bg-destructive/10 text-destructive"
                  : count === table.capacity
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
              title="Gasten / capaciteit"
            >
              {count}/{table.capacity}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4" /> Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {seated.length === 0 ? (
          <div className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">
            Sleep gasten hierheen
          </div>
        ) : (
          <ul className="space-y-1">
            {seated.map((g) => (
              <GuestChip
                key={g.id}
                guest={g}
                onDragStart={onGuestDragStart(g.id)}
                onDragEnd={onGuestDragEnd}
                onUnassign={() => onUnassign(g.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TableDialog({
  weddingId, existing, existingCount, onClose, onSaved,
}: {
  weddingId: string;
  existing: SeatingTable | null;
  existingCount: number;
  onClose: () => void;
  onSaved: (t: SeatingTable, isNew: boolean) => void;
}) {
  const isNew = !existing;
  const [name, setName] = useState(existing?.name ?? `Tafel ${existingCount + 1}`);
  const [capacity, setCapacity] = useState<number>(existing?.capacity ?? 8);
  const [shape, setShape] = useState<SeatingTableShape>(existing?.shape ?? "round");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Geef de tafel een naam.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    if (isNew) {
      const { data, error } = await supabase
        .from("seating_tables")
        .insert({
          wedding_id: weddingId,
          name: name.trim(),
          capacity,
          shape,
          notes: notes.trim() || null,
          sort_order: existingCount,
        })
        .select("*")
        .single();
      setSaving(false);
      if (error || !data) {
        toast.error("Kon niet opslaan", { description: error?.message });
        return;
      }
      toast.success("Tafel toegevoegd");
      onSaved(data as SeatingTable, true);
    } else {
      const { data, error } = await supabase
        .from("seating_tables")
        .update({
          name: name.trim(),
          capacity,
          shape,
          notes: notes.trim() || null,
        })
        .eq("id", existing!.id)
        .select("*")
        .single();
      setSaving(false);
      if (error || !data) {
        toast.error("Kon niet opslaan", { description: error?.message });
        return;
      }
      toast.success("Tafel bijgewerkt");
      onSaved(data as SeatingTable, false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Nieuwe tafel" : "Tafel bewerken"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Familie bruid"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capaciteit</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vorm</Label>
              <Select value={shape} onValueChange={(v) => setShape(v as SeatingTableShape)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Rond</SelectItem>
                  <SelectItem value="rectangle">Rechthoek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notitie (optioneel)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijv. bij het raam"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuleren
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
