"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2, Search, Globe2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { THEMES } from "@/lib/themes";
import { ALL_IDEAS } from "@/lib/ideas";
import { IDEA_CATEGORIES, getIdeaCategoryMeta } from "@/lib/ideas-types";
import type { IdeaCategory } from "@/lib/ideas-types";
import type { WeddingTheme } from "@/lib/types";

type Props = {
  weddingId: string;
  initialTheme: WeddingTheme;
  initialFavorites: string[];
};

export function IdeasView({ weddingId, initialTheme, initialFavorites }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState<WeddingTheme>(initialTheme);
  const [category, setCategory] = useState<IdeaCategory | "alle">("alle");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(initialFavorites));
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [allThemes, setAllThemes] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Als onlyFavorites of allThemes aan staat, vervalt de thema-filter — zo zie je
  // je favorieten uit alle thema's terug in je huidige thema.
  const crossTheme = allThemes || onlyFavorites;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_IDEAS.filter((idea) => {
      if (!crossTheme && idea.theme !== theme) return false;
      if (category !== "alle" && idea.category !== category) return false;
      if (onlyFavorites && !favorites.has(idea.id)) return false;
      if (q) {
        const hay = `${idea.title} ${idea.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [theme, category, query, onlyFavorites, favorites, crossTheme]);

  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = { alle: 0 };
    ALL_IDEAS.forEach((idea) => {
      if (!crossTheme && idea.theme !== theme) return;
      if (onlyFavorites && !favorites.has(idea.id)) return;
      map.alle = (map.alle ?? 0) + 1;
      map[idea.category] = (map[idea.category] ?? 0) + 1;
    });
    return map;
  }, [theme, crossTheme, onlyFavorites, favorites]);

  const favoritesTotal = useMemo(
    () => ALL_IDEAS.filter((i) => favorites.has(i.id)).length,
    [favorites]
  );

  const themeMetaByValue = useMemo(() => {
    const m = new Map<WeddingTheme, (typeof THEMES)[number]>();
    THEMES.forEach((t) => m.set(t.value, t));
    return m;
  }, []);

  async function switchTheme(next: WeddingTheme) {
    if (next === theme) return;
    setSavingTheme(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("weddings")
      .update({ theme: next })
      .eq("id", weddingId);
    setSavingTheme(false);
    if (error) {
      toast.error("Thema wisselen mislukt", { description: error.message });
      return;
    }
    setTheme(next);
    toast.success("Thema gewijzigd", { description: "Je hele app is nu in dit thema." });
    startTransition(() => router.refresh());
  }

  async function toggleFavorite(ideaId: string) {
    const supabase = createClient();
    const isFav = favorites.has(ideaId);
    setPendingFavorite(ideaId);

    // Optimistic update
    const next = new Set(favorites);
    if (isFav) next.delete(ideaId);
    else next.add(ideaId);
    setFavorites(next);

    const { error } = isFav
      ? await supabase
          .from("idea_favorites")
          .delete()
          .eq("wedding_id", weddingId)
          .eq("idea_id", ideaId)
      : await supabase
          .from("idea_favorites")
          .insert({ wedding_id: weddingId, idea_id: ideaId });

    setPendingFavorite(null);
    if (error) {
      // Rollback
      setFavorites((prev) => {
        const rb = new Set(prev);
        if (isFav) rb.add(ideaId);
        else rb.delete(ideaId);
        return rb;
      });
      toast.error("Favoriet opslaan mislukt", { description: error.message });
    }
  }

  return (
    <div>
      <PageHeader
        title="Ideeën"
        description={`Inspiratie voor jullie bruiloft — 1000 ideeën, gekoppeld aan jullie thema. ${favoritesTotal > 0 ? `Favorieten: ${favoritesTotal}` : ""}`}
      />

      {/* Theme switcher */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Jullie thema</p>
              <p className="text-xs text-muted-foreground">
                Wissel van thema om andere ideeën te zien — je bruiloftsthema in de app past zich meteen aan.
              </p>
            </div>
            {savingTheme && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active = t.value === theme;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => switchTheme(t.value)}
                  disabled={savingTheme}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent/30 text-muted-foreground"
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-border/50"
                    style={{ background: t.preview.primary }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek in ideeën..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={allThemes ? "default" : "outline"}
            onClick={() => setAllThemes((v) => !v)}
            className="gap-1.5"
            title="Bekijk ideeën uit alle thema's — je favorieten blijven bewaard, ook als je later van thema wisselt."
          >
            <Globe2 className="h-4 w-4" />
            Alle thema&apos;s
          </Button>
          <Button
            type="button"
            size="sm"
            variant={onlyFavorites ? "default" : "outline"}
            onClick={() => setOnlyFavorites((v) => !v)}
            className="gap-1.5"
          >
            <Heart className={cn("h-4 w-4", onlyFavorites && "fill-current")} />
            Alleen favorieten
          </Button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCategory("alle")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            category === "alle"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-accent/30 text-muted-foreground"
          )}
        >
          Alle <span className="ml-1 opacity-60">{countsByCategory.alle ?? 0}</span>
        </button>
        {IDEA_CATEGORIES.map((c) => {
          const active = category === c.value;
          const n = countsByCategory[c.value] ?? 0;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent/30 text-muted-foreground"
              )}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label} <span className="ml-1 opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Geen ideeën gevonden met deze filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => {
            const fav = favorites.has(idea.id);
            const busy = pendingFavorite === idea.id;
            const meta = getIdeaCategoryMeta(idea.category);
            const ideaTheme = themeMetaByValue.get(idea.theme);
            const showThemeBadge = crossTheme && idea.theme !== theme;
            return (
              <Card
                key={idea.id}
                className={cn(
                  "group relative overflow-hidden transition-all",
                  fav && "border-primary/60 ring-1 ring-primary/20"
                )}
              >
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {meta.emoji} {meta.label}
                      </Badge>
                      {showThemeBadge && ideaTheme ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: ideaTheme.preview.primary }}
                          />
                          {ideaTheme.label}
                        </Badge>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(idea.id)}
                      disabled={busy}
                      aria-label={fav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                      className={cn(
                        "rounded-full p-1.5 transition-colors",
                        fav ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                      )}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={cn("h-4 w-4", fav && "fill-current")} />
                      )}
                    </button>
                  </div>
                  <h3 className="font-serif text-base font-semibold leading-snug">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
