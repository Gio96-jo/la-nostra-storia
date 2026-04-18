"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Wedding } from "@/lib/types";

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;

function suggestSlug(wedding: Wedding) {
  const base = `${wedding.partner_one_name}-${wedding.partner_two_name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return base || "bruiloft";
}

export function PublicWebsiteCard({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(wedding.public_enabled);
  const [slug, setSlug] = useState(wedding.public_slug ?? suggestSlug(wedding));
  const [story, setStory] = useState(wedding.public_story ?? "");
  const [menu, setMenu] = useState(wedding.public_menu ?? "");
  const [dressCode, setDressCode] = useState(wedding.public_dress_code ?? "");
  const [deadline, setDeadline] = useState(wedding.public_rsvp_deadline ?? "");
  const [subtitle, setSubtitle] = useState(wedding.public_hero_subtitle ?? "");
  const [address, setAddress] = useState(wedding.public_address ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (!slug) return "";
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    return `${base}/s/${slug}`;
  }, [slug]);

  const slugValid = !slug || SLUG_RE.test(slug);

  async function save() {
    if (!slugValid) {
      toast.error("Kies een geldige URL-naam (kleine letters, cijfers, streepjes, 3-40 tekens).");
      return;
    }
    if (enabled && !slug) {
      toast.error("Kies eerst een URL-naam voordat je de site publiek maakt.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("weddings")
      .update({
        public_enabled: enabled,
        public_slug: slug || null,
        public_story: story || null,
        public_menu: menu || null,
        public_dress_code: dressCode || null,
        public_rsvp_deadline: deadline || null,
        public_hero_subtitle: subtitle || null,
        public_address: address || null,
      })
      .eq("id", wedding.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Deze URL-naam is al in gebruik — kies een andere.");
      } else {
        toast.error("Opslaan mislukt", { description: error.message });
      }
      return;
    }
    toast.success("Bruiloftssite opgeslagen");
    router.refresh();
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" />
          Publieke bruiloftssite & RSVP
        </CardTitle>
        <CardDescription>
          Zet een openbare pagina aan met jullie programma, menu en dresscode. Gasten kunnen via
          hun persoonlijke RSVP-link antwoorden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Site publiek maken</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Als dit uit staat kunnen gasten de site én hun RSVP-link nog steeds niet zien.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="h-5 w-9 appearance-none rounded-full bg-muted border transition-all checked:bg-primary relative cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform checked:after:translate-x-4"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </label>
        </div>

        <div className="space-y-2">
          <Label>URL-naam</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">/s/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="sophie-en-lucas"
            />
          </div>
          {!slugValid ? (
            <p className="text-xs text-destructive">
              Alleen kleine letters, cijfers en streepjes — 3 tot 40 tekens.
            </p>
          ) : slug ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Publieke URL:</span>
              <code className="px-2 py-0.5 rounded bg-muted">{publicUrl}</code>
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Gekopieerd" : "Kopieer"}
              </button>
              {enabled ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Open
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Ondertitel (boven datum)</Label>
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder='Bijv. "samen zeggen wij ja"'
          />
        </div>

        <div className="space-y-2">
          <Label>Ons verhaal</Label>
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Een klein woordje over jullie — hoe jullie elkaar ontmoet hebben..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Menu</Label>
          <Textarea
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            placeholder="Voorgerecht, hoofdgerecht, dessert..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Dresscode</Label>
          <Input
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder='Bijv. "cocktail chic" of "zomers elegant"'
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>RSVP-deadline</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Adres (volledig)</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straat 1, 1000 Brussel"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
