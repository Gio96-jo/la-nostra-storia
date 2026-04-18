"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { DayScheduleItem } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weddingId: string;
  editing: DayScheduleItem | null;
  onSaved: (item: DayScheduleItem) => void;
}

type GeoHit = {
  display_name: string;
  lat: string;
  lon: string;
};

export function ScheduleItemDialog({ open, onOpenChange, weddingId, editing, onSaved }: Props) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeoHit[]>([]);

  useEffect(() => {
    if (open) {
      setStartTime(editing?.start_time?.slice(0, 5) ?? "");
      setEndTime(editing?.end_time?.slice(0, 5) ?? "");
      setTitle(editing?.title ?? "");
      setDescription(editing?.description ?? "");
      setLocationName(editing?.location_name ?? "");
      setAddress(editing?.address ?? "");
      setLat(editing?.lat ?? null);
      setLng(editing?.lng ?? null);
      setHits([]);
    }
  }, [open, editing]);

  async function searchAddress() {
    if (!address.trim()) {
      toast.error("Vul eerst een adres in");
      return;
    }
    setSearching(true);
    setHits([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(address.trim())}`,
        { headers: { "Accept-Language": "nl" } }
      );
      if (!res.ok) throw new Error("Zoeken mislukt");
      const data = (await res.json()) as GeoHit[];
      if (data.length === 0) {
        toast.error("Geen resultaten gevonden");
      } else {
        setHits(data);
      }
    } catch (err) {
      toast.error("Zoeken mislukt", { description: (err as Error).message });
    } finally {
      setSearching(false);
    }
  }

  function pickHit(h: GeoHit) {
    setAddress(h.display_name);
    setLat(parseFloat(h.lat));
    setLng(parseFloat(h.lon));
    setHits([]);
    toast.success("Locatie gevonden");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Titel is verplicht"); return; }
    if (!startTime) { toast.error("Starttijd is verplicht"); return; }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      start_time: startTime,
      end_time: endTime || null,
      title: title.trim(),
      description: description.trim() || null,
      location_name: locationName.trim() || null,
      address: address.trim() || null,
      lat,
      lng,
    };
    const { data, error } = editing
      ? await supabase.from("day_schedule_items").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("day_schedule_items").insert(payload).select().single();
    setLoading(false);
    if (error || !data) {
      toast.error("Opslaan mislukt", { description: error?.message });
      return;
    }
    onSaved(data as DayScheduleItem);
    toast.success(editing ? "Bijgewerkt" : "Toegevoegd");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Onderdeel bewerken" : "Nieuw onderdeel"}</DialogTitle>
          <DialogDescription>Voeg een moment aan jullie trouwdag toe — optioneel met locatie op de kaart.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Starttijd *</Label>
              <Input id="start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Eindtijd</Label>
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              required
              placeholder="Ceremonie gemeentehuis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Omschrijving</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="Wat gebeurt er, wie is erbij, kledingcode..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc">Locatienaam</Label>
            <Input
              id="loc"
              placeholder="Gemeentehuis Brugge"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adr">Adres (voor op kaart)</Label>
            <div className="flex gap-2">
              <Input
                id="adr"
                placeholder="Burg 12, 8000 Brugge"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchAddress();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={searchAddress} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Zoek
              </Button>
            </div>
            {lat !== null && lng !== null ? (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                Op kaart: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Klik "Zoek" om de locatie op de kaart te plaatsen (OpenStreetMap — gratis).
              </p>
            )}
            {hits.length > 0 ? (
              <div className="border rounded-md overflow-hidden divide-y">
                {hits.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    onClick={() => pickHit(h)}
                  >
                    {h.display_name}
                  </button>
                ))}
              </div>
            ) : null}
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
