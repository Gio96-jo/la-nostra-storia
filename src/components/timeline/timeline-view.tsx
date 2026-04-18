"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, Circle, Heart, Sparkles, Hourglass,
  ClipboardList, Palette, PartyPopper, Bell, Clock, MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PHASES, getCategoryMeta } from "@/lib/constants";
import { cn, daysBetween, formatDateNL } from "@/lib/utils";
import type { ChecklistItem, WeddingPhase } from "@/lib/types";

interface Props {
  weddingDate: string;
  items: ChecklistItem[];
}

type PhaseStyle = {
  icon: typeof Heart;
  cardBg: string;
  cardBorder: string;
  dot: string;
  text: string;
  minDays: number | null; // inclusive lower bound of days-until-wedding for "current" detection
  maxDays: number | null; // inclusive upper bound
};

const PHASE_STYLES: Record<WeddingPhase, PhaseStyle> = {
  twaalf_plus_maanden: {
    icon: Sparkles,
    cardBg: "bg-violet-50",
    cardBorder: "border-violet-200",
    dot: "bg-violet-500",
    text: "text-violet-700",
    minDays: 366,
    maxDays: null,
  },
  negen_tot_twaalf_maanden: {
    icon: MapPin,
    cardBg: "bg-indigo-50",
    cardBorder: "border-indigo-200",
    dot: "bg-indigo-500",
    text: "text-indigo-700",
    minDays: 271,
    maxDays: 365,
  },
  zes_tot_negen_maanden: {
    icon: ClipboardList,
    cardBg: "bg-sky-50",
    cardBorder: "border-sky-200",
    dot: "bg-sky-500",
    text: "text-sky-700",
    minDays: 181,
    maxDays: 270,
  },
  drie_tot_zes_maanden: {
    icon: Palette,
    cardBg: "bg-teal-50",
    cardBorder: "border-teal-200",
    dot: "bg-teal-500",
    text: "text-teal-700",
    minDays: 91,
    maxDays: 180,
  },
  een_tot_drie_maanden: {
    icon: Hourglass,
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    minDays: 31,
    maxDays: 90,
  },
  een_maand_tot_een_week: {
    icon: Bell,
    cardBg: "bg-orange-50",
    cardBorder: "border-orange-200",
    dot: "bg-orange-500",
    text: "text-orange-700",
    minDays: 8,
    maxDays: 30,
  },
  laatste_week: {
    icon: Clock,
    cardBg: "bg-rose-50",
    cardBorder: "border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-700",
    minDays: 1,
    maxDays: 7,
  },
  op_de_dag_zelf: {
    icon: PartyPopper,
    cardBg: "bg-primary/10",
    cardBorder: "border-primary/40",
    dot: "bg-primary",
    text: "text-primary",
    minDays: null,
    maxDays: 0,
  },
};

function currentPhase(daysLeft: number): WeddingPhase {
  for (const p of PHASES) {
    const s = PHASE_STYLES[p.value];
    const minOk = s.minDays === null || daysLeft >= s.minDays;
    const maxOk = s.maxDays === null || daysLeft <= s.maxDays;
    if (minOk && maxOk) return p.value;
  }
  return "op_de_dag_zelf";
}

export function TimelineView({ weddingDate, items }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const wDate = new Date(weddingDate);
  const daysLeft = daysBetween(today, wDate);
  const currentPhaseValue = currentPhase(daysLeft);

  const byPhase = useMemo(() => {
    const m = new Map<WeddingPhase, ChecklistItem[]>();
    for (const p of PHASES) m.set(p.value, []);
    for (const item of items) m.get(item.phase)?.push(item);
    return m;
  }, [items]);

  const total = items.length;
  const done = items.filter((i) => i.is_completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Tijdlijn"
        description={daysLeft >= 0 ? `Nog ${daysLeft} dagen tot de grote dag` : "De grote dag is geweest"}
      />

      {/* Progress + datum card */}
      <Card className="mb-8">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Trouwdatum</p>
              <p className="font-serif text-2xl font-semibold">{formatDateNL(weddingDate)}</p>
            </div>
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Voorbereidingen</span>
              <span className="font-medium">{done}/{total} taken — {pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Nog geen taken in de tijdlijn.</p>
      ) : (
        <div className="relative">
          {/* Verticale lijn (links op mobiel, centraal op desktop) */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/30 left-4 lg:left-1/2 lg:-translate-x-1/2"
          />

          <div className="space-y-10 lg:space-y-14">
            {PHASES.map((p, idx) => {
              const phaseItems = byPhase.get(p.value) ?? [];
              if (phaseItems.length === 0) return null;
              const style = PHASE_STYLES[p.value];
              const Icon = style.icon;
              const isCurrent = p.value === currentPhaseValue;
              const phaseDone = phaseItems.filter((i) => i.is_completed).length;
              const phasePct = Math.round((phaseDone / phaseItems.length) * 100);
              const allDone = phaseDone === phaseItems.length;
              // Alternating left/right on desktop
              const alignRight = idx % 2 === 1;

              return (
                <section
                  key={p.value}
                  className={cn(
                    "relative animate-in fade-in slide-in-from-bottom-4 duration-500",
                  )}
                  style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
                >
                  {/* Central icon */}
                  <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-0 -translate-y-1 z-10">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full border-2 border-background shadow-sm flex items-center justify-center text-white",
                        style.dot,
                        isCurrent && "ring-4 ring-primary/30 animate-pulse"
                      )}
                      style={{ transform: "translateX(-50%)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* "Je bent hier" marker */}
                  {isCurrent ? (
                    <div
                      className={cn(
                        "absolute top-0 -translate-y-8 z-10",
                        "left-4 lg:left-1/2 lg:-translate-x-1/2",
                      )}
                    >
                      <div
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-md whitespace-nowrap"
                        style={{ transform: "translateX(-50%)" }}
                      >
                        <MapPin className="h-3 w-3" />
                        Je bent hier
                      </div>
                    </div>
                  ) : null}

                  {/* Content card — alternating on desktop */}
                  <div
                    className={cn(
                      "pl-14 lg:pl-0 lg:grid lg:grid-cols-2 lg:gap-10",
                    )}
                  >
                    <div className={cn(alignRight ? "lg:col-start-2" : "lg:col-start-1")}>
                      <Card className={cn("overflow-hidden", style.cardBorder, isCurrent && "ring-2 ring-primary/40")}>
                        <div className={cn("px-4 py-3 flex items-center justify-between gap-3", style.cardBg)}>
                          <div className="min-w-0">
                            <p className={cn("text-[11px] uppercase tracking-wide font-semibold", style.text)}>
                              Fase {PHASES.findIndex((x) => x.value === p.value) + 1}
                            </p>
                            <h2 className="font-serif text-lg font-semibold leading-tight">{p.label}</h2>
                          </div>
                          <div className="shrink-0 text-right">
                            <Badge variant="outline" className="text-[11px]">
                              {phaseDone}/{phaseItems.length} {allDone ? "✓" : ""}
                            </Badge>
                          </div>
                        </div>
                        <div className="px-4 pt-2">
                          <Progress value={phasePct} className="h-1.5" />
                        </div>
                        <CardContent className="p-4 space-y-2">
                          {phaseItems.map((item) => {
                            const cat = getCategoryMeta(item.category);
                            return (
                              <Link
                                href={`/checklist?highlight=${item.id}`}
                                key={item.id}
                                className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:bg-accent/20 transition-colors"
                              >
                                {item.is_completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-sage-500 mt-0.5 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm font-medium",
                                    item.is_completed && "line-through text-muted-foreground"
                                  )}>
                                    {item.title}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge className={cat.color}>{cat.label}</Badge>
                                    {item.due_date ? (
                                      <span className="inline-flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" /> {formatDateNL(item.due_date)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Wedding day marker */}
            <section
              className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "600ms", animationFillMode: "both" }}
            >
              <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-0 -translate-y-1 z-10">
                <div
                  className="h-12 w-12 rounded-full bg-primary border-2 border-background shadow-lg flex items-center justify-center"
                  style={{ transform: "translateX(-50%)" }}
                >
                  <Heart className="h-6 w-6 text-white" fill="white" />
                </div>
              </div>
              <div className="pl-14 lg:pl-0 lg:grid lg:grid-cols-1">
                <div className="mx-auto w-full max-w-xl rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                  <p className="font-serif text-2xl font-semibold text-primary">De grote dag</p>
                  <p className="text-sm text-muted-foreground mt-1">{formatDateNL(weddingDate)}</p>
                  {daysLeft > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">Nog <span className="font-semibold text-foreground">{daysLeft}</span> dagen</p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
