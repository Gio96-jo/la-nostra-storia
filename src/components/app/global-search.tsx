"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ListChecks, Loader2, NotebookPen, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Hit =
  | { kind: "task"; id: string; title: string; subtitle?: string | null }
  | { kind: "guest"; id: string; title: string; subtitle?: string | null }
  | { kind: "supplier"; id: string; title: string; subtitle?: string | null }
  | { kind: "note"; id: string; title: string; subtitle?: string | null };

const KIND_META: Record<Hit["kind"], { label: string; icon: typeof ListChecks; href: (id: string) => string }> = {
  task: { label: "Taak", icon: ListChecks, href: (id) => `/checklist?highlight=${id}` },
  guest: { label: "Gast", icon: Users, href: () => `/gasten` },
  supplier: { label: "Leverancier", icon: Building2, href: () => `/leveranciers` },
  note: { label: "Notitie", icon: NotebookPen, href: () => `/notities` },
};

export function GlobalSearch({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const like = `%${q}%`;
      const [tasks, guests, suppliers, notes] = await Promise.all([
        supabase
          .from("checklist_items")
          .select("id,title,description")
          .eq("wedding_id", weddingId)
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(6)
          .abortSignal(ctrl.signal),
        supabase
          .from("guests")
          .select("id,first_name,last_name,email")
          .eq("wedding_id", weddingId)
          .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
          .limit(6)
          .abortSignal(ctrl.signal),
        supabase
          .from("suppliers")
          .select("id,name,category,contact_name")
          .eq("wedding_id", weddingId)
          .or(`name.ilike.${like},contact_name.ilike.${like}`)
          .limit(6)
          .abortSignal(ctrl.signal),
        supabase
          .from("notes")
          .select("id,title,content")
          .eq("wedding_id", weddingId)
          .or(`title.ilike.${like},content.ilike.${like}`)
          .limit(6)
          .abortSignal(ctrl.signal),
      ]);
      const next: Hit[] = [
        ...(tasks.data ?? []).map((r: { id: string; title: string; description: string | null }) => ({
          kind: "task" as const, id: r.id, title: r.title, subtitle: r.description,
        })),
        ...(guests.data ?? []).map((r: { id: string; first_name: string; last_name: string | null; email: string | null }) => ({
          kind: "guest" as const, id: r.id,
          title: `${r.first_name}${r.last_name ? " " + r.last_name : ""}`,
          subtitle: r.email,
        })),
        ...(suppliers.data ?? []).map((r: { id: string; name: string; contact_name: string | null; category: string | null }) => ({
          kind: "supplier" as const, id: r.id, title: r.name,
          subtitle: [r.category, r.contact_name].filter(Boolean).join(" · ") || null,
        })),
        ...(notes.data ?? []).map((r: { id: string; title: string; content: string | null }) => ({
          kind: "note" as const, id: r.id, title: r.title, subtitle: r.content,
        })),
      ];
      setHits(next);
      setLoading(false);
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, weddingId]);

  function go(h: Hit) {
    const meta = KIND_META[h.kind];
    setOpen(false);
    router.push(meta.href(h.id));
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full"
        aria-label="Zoeken"
        title="Zoeken (⌘K)"
      >
        <Search className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek taken, gasten, leveranciers, notities..."
                className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-1">
              {query.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Typ minstens 2 tekens — zoekt in alles tegelijk.
                </p>
              ) : hits.length === 0 && !loading ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Niets gevonden voor "{query}".
                </p>
              ) : (
                <ul className="divide-y">
                  {hits.map((h) => {
                    const meta = KIND_META[h.kind];
                    const Icon = meta.icon;
                    return (
                      <li key={`${h.kind}-${h.id}`}>
                        <button
                          type="button"
                          onClick={() => go(h)}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                            "hover:bg-accent/50"
                          )}
                        >
                          <Icon className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{h.title}</span>
                            {h.subtitle ? (
                              <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>
                            ) : null}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0 mt-1">
                            {meta.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Tip: ⌘K / Ctrl+K opent zoeken</span>
              <span>Enter navigeert naar de pagina</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
