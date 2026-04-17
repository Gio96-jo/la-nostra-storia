"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { GUEST_RELATIONS, RSVP_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Guest, GuestRelation, RsvpStatus } from "@/lib/types";
import { GuestsTable } from "./guests-table";
import { GuestDialog } from "./guest-dialog";

interface Props {
  weddingId: string;
  initialGuests: Guest[];
}

export function GuestsView({ weddingId, initialGuests }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [filterRelation, setFilterRelation] = useState<"all" | GuestRelation>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | RsvpStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);

  const stats = useMemo(() => {
    const counts = { total: guests.length, bevestigd: 0, afgemeld: 0, in_afwachting: 0, uitgenodigd: 0 };
    let plusOnes = 0;
    for (const g of guests) {
      counts[g.rsvp_status]++;
      if (g.plus_one && g.rsvp_status === "bevestigd") plusOnes++;
    }
    return { ...counts, plusOnes };
  }, [guests]);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (filterRelation !== "all" && g.relation !== filterRelation) return false;
      if (filterStatus !== "all" && g.rsvp_status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const full = `${g.first_name} ${g.last_name ?? ""} ${g.email ?? ""}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [guests, search, filterRelation, filterStatus]);

  function upsert(g: Guest) {
    setGuests((prev) => {
      const idx = prev.findIndex((x) => x.id === g.id);
      if (idx === -1) return [g, ...prev];
      const copy = prev.slice();
      copy[idx] = g;
      return copy;
    });
  }

  async function deleteGuest(id: string) {
    const prev = guests;
    setGuests((p) => p.filter((g) => g.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) {
      setGuests(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Gast verwijderd");
    }
  }

  async function quickStatus(id: string, status: RsvpStatus) {
    setGuests((p) => p.map((g) => (g.id === id ? { ...g, rsvp_status: status } : g)));
    const supabase = createClient();
    await supabase.from("guests").update({ rsvp_status: status }).eq("id", id);
  }

  function exportCsv() {
    if (guests.length === 0) {
      toast.error("Geen gasten om te exporteren");
      return;
    }
    const header = ["Voornaam", "Achternaam", "Email", "Telefoon", "Relatie", "RSVP", "Tafel", "Dieetwensen", "+1", "Notities"];
    const rows = guests.map((g) => [
      g.first_name,
      g.last_name ?? "",
      g.email ?? "",
      g.phone ?? "",
      GUEST_RELATIONS.find((r) => r.value === g.relation)?.label ?? g.relation,
      RSVP_STATUSES.find((r) => r.value === g.rsvp_status)?.label ?? g.rsvp_status,
      g.table_group ?? "",
      g.dietary_wishes ?? "",
      g.plus_one ? "Ja" : "Nee",
      g.notes ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastenlijst-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV gedownload");
  }

  return (
    <div>
      <PageHeader
        title="Gastenlijst"
        description="Beheer wie er komt, dieetwensen en de tafelindeling."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Nieuwe gast
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Stat label="Totaal" value={stats.total} />
        <Stat label="Bevestigd" value={stats.bevestigd} accent="text-sage-700" />
        <Stat label="Afgemeld" value={stats.afgemeld} accent="text-rose-700" />
        <Stat label="In afwachting" value={stats.in_afwachting + stats.uitgenodigd} accent="text-amber-700" />
        <Stat label="+1" value={stats.plusOnes} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Zoek op naam of e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterRelation} onValueChange={(v) => setFilterRelation(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle relaties</SelectItem>
            {GUEST_RELATIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            {RSVP_STATUSES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nog geen gasten"
              description="Voeg jullie eerste gast toe om te beginnen met de indeling."
              action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Eerste gast</Button>}
              className="m-6"
            />
          ) : (
            <GuestsTable
              guests={filtered}
              onEdit={(g) => { setEditing(g); setDialogOpen(true); }}
              onDelete={deleteGuest}
              onStatusChange={quickStatus}
            />
          )}
        </CardContent>
      </Card>

      <GuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weddingId={weddingId}
        editing={editing}
        onSaved={upsert}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 font-serif text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
