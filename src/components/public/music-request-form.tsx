"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Music, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export function MusicRequestForm({ token }: { token: string }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [spotify, setSpotify] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!title.trim()) {
      toast.error("Vul minstens een nummer in.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("public_submit_music_request" as never, {
      p_token: token,
      p_song_title: title,
      p_artist: artist,
      p_spotify_url: spotify,
      p_note: note,
    } as never);
    setSaving(false);
    if (error) {
      toast.error("Verzenden mislukt", { description: error.message });
      return;
    }
    toast.success("Bedankt, we noteren je wens!");
    setSubmitted(true);
    setTitle("");
    setArtist("");
    setSpotify("");
    setNote("");
  }

  return (
    <section className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <h2 className="font-serif text-2xl font-semibold flex items-center gap-2 mb-1">
        <Music className="h-5 w-5 text-primary" />
        Muziekwens
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Welk nummer mag er zeker niet ontbreken op de dansvloer? Laat ons weten!
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="song">Nummer</Label>
          <Input
            id="song"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Dancing Queen"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artist">Artiest (optioneel)</Label>
          <Input
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="ABBA"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spotify">Spotify-link (optioneel)</Label>
          <Input
            id="spotify"
            type="url"
            value={spotify}
            onChange={(e) => setSpotify(e.target.value)}
            placeholder="https://open.spotify.com/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="music-note">Waarom dit nummer? (optioneel)</Label>
          <Textarea
            id="music-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Bijv. herinnert me aan onze studententijd..."
          />
        </div>
      </div>

      <Button onClick={submit} disabled={saving || !title.trim()} className="mt-5 w-full" size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : submitted ? <Check className="h-4 w-4" /> : <Music className="h-4 w-4" />}
        {submitted ? "Nog een nummer voorstellen" : "Verstuur wens"}
      </Button>
    </section>
  );
}
