"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CalendarClock, Clock, ExternalLink, Globe, MapPin, Navigation, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateNL } from "@/lib/utils";
import type { DayScheduleItem } from "@/lib/types";
import { ScheduleItemDialog } from "./schedule-item-dialog";

// Leaflet has window references → client-only
const DayScheduleMap = dynamic(
  () => import("./day-schedule-map").then((m) => m.DayScheduleMap),
  { ssr: false, loading: () => <div className="h-80 bg-muted/30 rounded-lg animate-pulse" /> }
);

interface Props {
  weddingId: string;
  weddingDate: string;
  initial: DayScheduleItem[];
}

function formatTime(t: string | null): string {
  if (!t) return "";
  // "HH:MM:SS" → "HH:MM"
  return t.slice(0, 5);
}

function mapsViewUrl(item: DayScheduleItem): string | null {
  if (item.lat !== null && item.lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
  }
  if (item.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`;
  }
  return null;
}

function mapsDirectionsUrl(item: DayScheduleItem): string | null {
  if (item.lat !== null && item.lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
  }
  if (item.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`;
  }
  return null;
}

export function DagplanningView({ weddingId, weddingDate, initial }: Props) {
  const [items, setItems] = useState<DayScheduleItem[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DayScheduleItem | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [items]
  );

  const mapItems = useMemo(
    () => sorted.filter((i) => i.lat !== null && i.lng !== null),
    [sorted]
  );

  function upsert(n: DayScheduleItem) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === n.id);
      if (i === -1) return [...prev, n];
      const copy = prev.slice();
      copy[i] = n;
      return copy;
    });
  }

  async function deleteItem(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("day_schedule_items").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Onderdeel verwijderd");
    }
  }

  return (
    <div>
      <PageHeader
        title="Dagplanning"
        description={`Uur per uur schema voor jullie trouwdag op ${formatDateNL(weddingDate)}.`}
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        }
      />

      {/* Kaart */}
      {mapItems.length > 0 ? (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-base font-semibold">Kaart met locaties</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {mapItems.length} {mapItems.length === 1 ? "locatie" : "locaties"}
              </span>
            </div>
            <DayScheduleMap items={mapItems} />
          </CardContent>
        </Card>
      ) : null}

      {/* Timeline */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nog geen planning"
          description="Bouw jullie trouwdag uur voor uur op — van gemeentehuis tot feestzaal."
          action={
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Eerste onderdeel
            </Button>
          }
        />
      ) : (
        <div className="relative space-y-3">
          {/* verticale lijn */}
          <div className="absolute left-[70px] top-2 bottom-2 w-px bg-border hidden sm:block" />
          {sorted.map((item, idx) => (
            <div key={item.id} className="relative flex gap-3 sm:gap-4">
              <div className="shrink-0 w-[60px] sm:w-[70px] pt-4 text-right">
                <div className="text-sm font-semibold tabular-nums">
                  {formatTime(item.start_time)}
                </div>
                {item.end_time ? (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatTime(item.end_time)}
                  </div>
                ) : null}
              </div>
              <div className="hidden sm:flex shrink-0 w-4 pt-5 justify-center">
                <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background relative z-10" />
              </div>
              <Card className="flex-1 card-hover">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-semibold leading-tight flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          {idx + 1}
                        </span>
                        {item.title}
                      </h3>
                      {item.location_name || item.address ? (
                        <p className="mt-1 inline-flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            {item.location_name ? (
                              <span className="font-medium text-foreground">{item.location_name}</span>
                            ) : null}
                            {item.location_name && item.address ? " — " : ""}
                            {item.address ?? ""}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(item); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" /> Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                  {item.end_time ? (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </p>
                  ) : null}
                  {(mapsViewUrl(item) || mapsDirectionsUrl(item) || item.website) ? (
                    <div className="flex flex-wrap gap-2 pt-1 no-print">
                      {mapsViewUrl(item) ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={mapsViewUrl(item)!} target="_blank" rel="noreferrer">
                            <MapPin className="h-3.5 w-3.5" />
                            Open in Maps
                          </a>
                        </Button>
                      ) : null}
                      {mapsDirectionsUrl(item) ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={mapsDirectionsUrl(item)!} target="_blank" rel="noreferrer">
                            <Navigation className="h-3.5 w-3.5" />
                            Route berekenen
                          </a>
                        </Button>
                      ) : null}
                      {item.website ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={item.website} target="_blank" rel="noreferrer">
                            <Globe className="h-3.5 w-3.5" />
                            Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <ScheduleItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weddingId={weddingId}
        editing={editing}
        onSaved={upsert}
      />
    </div>
  );
}
