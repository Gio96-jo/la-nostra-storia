"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Music, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import type { MusicRequest } from "@/lib/types";

export function MusicRequestsView({ initial }: { initial: MusicRequest[] }) {
  const [items, setItems] = useState<MusicRequest[]>(initial);

  async function remove(id: string) {
    if (!confirm("Deze wens verwijderen?")) return;
    const prev = items;
    setItems((xs) => xs.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("music_requests").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Kon niet verwijderen", { description: error.message });
    }
  }

  return (
    <div>
      <PageHeader
        title="Muziekwensen"
        description="Nummers die jullie gasten graag zouden horen op de bruiloft."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Music}
          title="Nog geen muziekwensen"
          description="Zodra gasten via hun RSVP-link een nummer voorstellen, verschijnen ze hier."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-serif text-base font-semibold leading-tight">
                      {m.song_title}
                    </p>
                    {m.artist ? (
                      <p className="text-sm text-muted-foreground truncate">{m.artist}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(m.id)}
                    title="Verwijderen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {m.note ? (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic">
                    &ldquo;{m.note}&rdquo;
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    door {m.guest_name}
                  </p>
                  {m.spotify_url ? (
                    <a
                      href={m.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Spotify <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
