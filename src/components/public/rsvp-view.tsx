"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { GuestInviteType, RsvpStatus, WeddingTheme } from "@/lib/types";
import { PublicWeddingSite } from "./public-wedding-site";
import type { PublicWeddingData, PublicPhoto } from "./public-wedding-site";
import { MusicRequestForm } from "./music-request-form";

interface Guest {
  id: string;
  first_name: string;
  last_name: string | null;
  invite_type: GuestInviteType;
  rsvp_status: RsvpStatus;
  plus_one: boolean;
  plus_one_name: string | null;
  dietary_wishes: string | null;
  rsvp_submitted_at: string | null;
}

export interface RsvpPayload {
  guest: Guest;
  wedding: PublicWeddingData["wedding"] & {
    public_slug: string | null;
    public_enabled: boolean;
  };
  schedule: PublicWeddingData["schedule"];
  photos?: PublicPhoto[];
  couplePhotoUrl?: string | null;
}

export function RsvpView({ token, payload }: { token: string; payload: RsvpPayload }) {
  const { guest, wedding, schedule, photos = [], couplePhotoUrl = null } = payload;

  const [status, setStatus] = useState<"bevestigd" | "afgemeld" | null>(
    guest.rsvp_status === "bevestigd" || guest.rsvp_status === "afgemeld"
      ? guest.rsvp_status
      : null
  );
  const [plusOne, setPlusOne] = useState(guest.plus_one);
  const [plusOneName, setPlusOneName] = useState(guest.plus_one_name ?? "");
  const [dietary, setDietary] = useState(guest.dietary_wishes ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(guest.rsvp_submitted_at));

  async function submit() {
    if (!status) {
      toast.error("Laat ons weten of je kunt komen.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("public_submit_rsvp" as never, {
      p_token: token,
      p_status: status,
      p_plus_one: plusOne,
      p_plus_one_name: plusOneName,
      p_dietary_wishes: dietary,
      p_notes: notes,
    } as never);
    setSaving(false);
    if (error) {
      toast.error("Verzenden mislukt", { description: error.message });
      return;
    }
    setSubmitted(true);
    toast.success(
      status === "bevestigd" ? "Geweldig, tot dan!" : "Bedankt voor het laten weten."
    );
  }

  const rsvpSlot = (
    <section className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="font-serif text-2xl font-semibold">
          Hey {guest.first_name}, kom je?
        </h2>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
            guest.invite_type === "evening_only"
              ? "bg-indigo-100 text-indigo-800"
              : "bg-sage-100 text-sage-800"
          )}
        >
          {guest.invite_type === "evening_only" ? (
            <>
              <Moon className="h-3 w-3" /> Alleen avondfeest
            </>
          ) : (
            <>
              <Sun className="h-3 w-3" /> Hele dag
            </>
          )}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {guest.invite_type === "evening_only"
          ? "Je bent van harte uitgenodigd voor het avondfeest."
          : "Je bent van harte uitgenodigd voor onze hele trouwdag."}
        {wedding.public_rsvp_deadline ? (
          <> Laat het ons weten vóór {wedding.public_rsvp_deadline}.</>
        ) : null}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setStatus("bevestigd")}
          className={cn(
            "rounded-lg border p-4 text-sm font-medium transition-colors",
            status === "bevestigd"
              ? "border-primary bg-primary/10 text-primary"
              : "hover:bg-accent/30"
          )}
        >
          <Check className="mx-auto h-5 w-5 mb-1" />
          Ja, ik ben erbij
        </button>
        <button
          type="button"
          onClick={() => setStatus("afgemeld")}
          className={cn(
            "rounded-lg border p-4 text-sm font-medium transition-colors",
            status === "afgemeld"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "hover:bg-accent/30"
          )}
        >
          <X className="mx-auto h-5 w-5 mb-1" />
          Helaas, ik kan niet
        </button>
      </div>

      {status === "bevestigd" ? (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={plusOne}
              onChange={(e) => setPlusOne(e.target.checked)}
              className="h-4 w-4"
            />
            Ik neem iemand mee (+1)
          </label>
          {plusOne ? (
            <div className="space-y-1.5">
              <Label htmlFor="plusOneName">Naam +1</Label>
              <Input
                id="plusOneName"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                placeholder="Voornaam + achternaam"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="dietary">Dieetwensen of allergieën</Label>
            <Textarea
              id="dietary"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="Bijv. vegetarisch, glutenvrij, notenallergie..."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Iets anders dat we moeten weten?</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optioneel"
              rows={2}
            />
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        onClick={submit}
        disabled={saving || !status}
        className="mt-6 w-full"
        size="lg"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitted ? "Antwoord bijwerken" : "Verstuur RSVP"}
      </Button>

      {submitted ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Je antwoord is opgeslagen — je kunt het altijd aanpassen.
        </p>
      ) : null}
    </section>
  );

  return (
    <PublicWeddingSite
      data={{ wedding, schedule, photos, couplePhotoUrl }}
      rsvpSlot={
        <>
          {rsvpSlot}
          <MusicRequestForm token={token} />
        </>
      }
    />
  );
}
