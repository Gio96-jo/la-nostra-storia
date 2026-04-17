"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Heart, Circle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/lib/constants";
import { cn, daysBetween, formatDateNL } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/types";

interface Props {
  weddingDate: string;
  items: ChecklistItem[];
}

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function TimelineView({ weddingDate, items }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      if (!item.due_date) continue;
      const d = new Date(item.due_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const wDate = new Date(weddingDate);
  const daysLeft = daysBetween(today, wDate);

  return (
    <div>
      <PageHeader
        title="Tijdlijn"
        description={daysLeft >= 0 ? `Nog ${daysLeft} dagen tot de grote dag` : "De grote dag is geweest"}
      />

      <Card className="mb-6">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Trouwdatum</p>
            <p className="font-serif text-2xl font-semibold">{formatDateNL(weddingDate)}</p>
          </div>
          <Heart className="h-8 w-8 text-primary" fill="currentColor" />
        </CardContent>
      </Card>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Nog geen taken met een deadline.</p>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/20 space-y-8">
          {grouped.map(([key, monthItems]) => {
            const [y, m] = key.split("-").map(Number);
            const monthLabel = `${MONTHS_NL[m]} ${y}`;
            const monthDate = new Date(y, m, 1);
            const isPast = monthDate < new Date(today.getFullYear(), today.getMonth(), 1);
            const isCurrent =
              monthDate.getFullYear() === today.getFullYear() &&
              monthDate.getMonth() === today.getMonth();
            const allDone = monthItems.every((i) => i.is_completed);
            return (
              <section key={key} className="relative">
                <div
                  className={cn(
                    "absolute -left-[33px] sm:-left-[37px] top-1 w-4 h-4 rounded-full border-2",
                    allDone ? "bg-sage-400 border-sage-500" :
                    isCurrent ? "bg-primary border-primary animate-pulse" :
                    isPast ? "bg-muted border-muted-foreground/30" :
                    "bg-background border-primary/40"
                  )}
                />
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className={cn("font-serif text-xl font-semibold capitalize", isCurrent && "text-primary")}>
                    {monthLabel}
                  </h2>
                  <Badge variant="outline" className="text-[11px]">
                    {monthItems.filter((i) => i.is_completed).length}/{monthItems.length} klaar
                  </Badge>
                </div>
                <div className="space-y-2">
                  {monthItems.map((item) => {
                    const cat = getCategoryMeta(item.category);
                    return (
                      <Link
                        href="/checklist"
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors"
                      >
                        {item.is_completed ? (
                          <CheckCircle2 className="h-4 w-4 text-sage-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", item.is_completed && "line-through text-muted-foreground")}>
                            {item.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge className={cat.color}>{cat.label}</Badge>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" /> {formatDateNL(item.due_date)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Wedding day marker */}
          <section className="relative">
            <div className="absolute -left-[37px] sm:-left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
              <Heart className="h-3 w-3 text-white" fill="white" />
            </div>
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
              <p className="font-serif text-xl font-semibold text-primary">De grote dag</p>
              <p className="text-sm text-muted-foreground mt-1">{formatDateNL(weddingDate)}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
