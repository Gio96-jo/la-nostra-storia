"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { Wedding, WeddingTheme } from "@/lib/types";

interface State {
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string;
  estimated_budget: string;
  estimated_guest_count: string;
  venue_name: string;
  city: string;
  theme: WeddingTheme;
}

const TOTAL_STEPS = 5;

export function OnboardingWizard({ userId, existing }: { userId: string; existing: Wedding | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [s, setS] = useState<State>({
    partner_one_name: existing?.partner_one_name ?? "",
    partner_two_name: existing?.partner_two_name ?? "",
    wedding_date: existing?.wedding_date ?? "",
    estimated_budget: existing?.estimated_budget?.toString() ?? "",
    estimated_guest_count: existing?.estimated_guest_count?.toString() ?? "",
    venue_name: existing?.venue_name ?? "",
    city: existing?.city ?? "",
    theme: (existing?.theme as WeddingTheme | undefined) ?? "romantisch_blush",
  });

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  function validate(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!s.partner_one_name.trim() || !s.partner_two_name.trim()) return "Vul beide namen in";
    }
    if (currentStep === 1) {
      if (!s.wedding_date) return "Kies een datum";
      const d = new Date(s.wedding_date);
      if (Number.isNaN(d.getTime())) return "Ongeldige datum";
    }
    return null;
  }

  function next() {
    const err = validate(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }

  async function finish() {
    const supabase = createClient();
    setLoading(true);
    const payload = {
      owner_id: userId,
      partner_one_name: s.partner_one_name.trim(),
      partner_two_name: s.partner_two_name.trim(),
      wedding_date: s.wedding_date,
      estimated_budget: s.estimated_budget ? Number(s.estimated_budget) : null,
      estimated_guest_count: s.estimated_guest_count ? Number(s.estimated_guest_count) : null,
      venue_name: s.venue_name || null,
      city: s.city || null,
      theme: s.theme,
      onboarding_completed: true,
    };

    const { error } = existing
      ? await supabase.from("weddings").update(payload).eq("id", existing.id)
      : await supabase.from("weddings").insert(payload);

    setLoading(false);
    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
      return;
    }
    toast.success(`Welkom bij ${APP_NAME}!`);
    router.push("/dashboard");
    router.refresh();
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="romantic-gradient min-h-screen flex flex-col">
      <header className="container py-6">
        <div className="inline-flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          <span className="font-serif text-xl font-semibold">{APP_NAME}</span>
        </div>
      </header>
      <main className="flex flex-1 items-start sm:items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-lg animate-fade-in">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground">Stap {step + 1} van {TOTAL_STEPS}</p>
            <Progress value={progress} className="mt-2" />
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Wie gaan er trouwen?</h1>
                <p className="text-sm text-muted-foreground mt-1">Vul de voornamen van beide partners in.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p1">Partner 1</Label>
                  <Input id="p1" value={s.partner_one_name} onChange={(e) => set("partner_one_name", e.target.value)} placeholder="Bijv. Sophie" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2">Partner 2</Label>
                  <Input id="p2" value={s.partner_two_name} onChange={(e) => set("partner_two_name", e.target.value)} placeholder="Bijv. Lucas" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Wanneer is de grote dag?</h1>
                <p className="text-sm text-muted-foreground mt-1">Geen exacte datum? Kies een streefdatum — je kunt dit altijd aanpassen.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Trouwdatum</Label>
                <Input id="date" type="date" value={s.wedding_date} onChange={(e) => set("wedding_date", e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Eerste indicatie</h1>
                <p className="text-sm text-muted-foreground mt-1">Helemaal niet erg als je dit nog niet weet. Sla over of vul een schatting in.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€)</Label>
                  <Input id="budget" type="number" min={0} step={500} placeholder="20000" value={s.estimated_budget} onChange={(e) => set("estimated_budget", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests">Aantal gasten</Label>
                  <Input id="guests" type="number" min={0} step={1} placeholder="80" value={s.estimated_guest_count} onChange={(e) => set("estimated_guest_count", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Kies jullie thema</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Dit bepaalt de kleuren en sfeer van jullie app. Je kunt het later altijd wijzigen via Instellingen of de Ideeën-pagina.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const active = s.theme === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("theme", t.value)}
                      className={cn(
                        "group rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-accent/20"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="h-5 w-5 rounded-full border border-border/50"
                          style={{ background: t.preview.primary }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-border/50"
                          style={{ background: t.preview.accent }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-border/50"
                          style={{ background: t.preview.bg }}
                        />
                      </div>
                      <p className="font-serif text-sm font-semibold leading-tight">{t.label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Locatie (optioneel)</h1>
                <p className="text-sm text-muted-foreground mt-1">Heb je al een locatie op het oog?</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Naam locatie</Label>
                  <Input id="venue" placeholder="Bijv. Kasteel de Wittenburg" value={s.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Stad</Label>
                  <Input id="city" placeholder="Bijv. Wassenaar" value={s.city} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
              <div className="rounded-md bg-sage-100 border border-sage-200 p-4 text-sm text-sage-900">
                Klaar om te beginnen! Wij maken automatisch een complete checklist met meer dan 50 taken op basis van jullie trouwdatum.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={prev} disabled={step === 0 || loading}>
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={next} disabled={loading}>
                Volgende <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Naar dashboard"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
