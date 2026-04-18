"use client";

import { useMemo } from "react";
import { UtensilsCrossed, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { Guest } from "@/lib/types";

interface Props {
  guests: Guest[];
  partnerNames: string;
  weddingDate: string;
}

// Matcht wensen op bekende categorieën zodat we ook aggregeren per type.
const CATEGORY_KEYWORDS: { label: string; keywords: RegExp }[] = [
  { label: "Vegetarisch", keywords: /\bvega?ta?risch|veggi|no meat|geen vlees/i },
  { label: "Veganistisch", keywords: /\bvega?n\b/i },
  { label: "Glutenvrij", keywords: /gluten(\-| )?vri|coeliaki|celiac/i },
  { label: "Lactosevrij / geen zuivel", keywords: /lactose|zuivel(\-| )?vri|dairy.?free/i },
  { label: "Notenallergie", keywords: /no(t|oten)|nut(\s|s)?allerg/i },
  { label: "Pinda-allergie", keywords: /pinda|peanut/i },
  { label: "Vis / schaaldieren", keywords: /vis|schaal|shell|zeevruchten/i },
  { label: "Halal", keywords: /halal/i },
  { label: "Kosher", keywords: /kosher|koshere|koosjer/i },
  { label: "Diabetes", keywords: /diabet|suiker(\-| )?vri/i },
];

export function DietaryView({ guests, partnerNames, weddingDate }: Props) {
  const withDiet = useMemo(
    () => guests.filter((g) => g.dietary_wishes && g.dietary_wishes.trim().length > 0),
    [guests]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of withDiet) {
      const text = g.dietary_wishes ?? "";
      for (const cat of CATEGORY_KEYWORDS) {
        if (cat.keywords.test(text)) {
          map.set(cat.label, (map.get(cat.label) ?? 0) + 1 + (g.plus_one ? 1 : 0));
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [withDiet]);

  const totalGuests = guests.length + guests.filter((g) => g.plus_one).length;
  const confirmed = guests.filter((g) => g.rsvp_status === "bevestigd");
  const confirmedTotal = confirmed.length + confirmed.filter((g) => g.plus_one).length;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Dieetoverzicht"
          description="Alle dieetwensen van je gasten — ideaal voor de cateraar."
          actions={
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
          }
        />
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="font-serif text-3xl font-semibold">Dieetoverzicht</h1>
        <p className="text-sm text-muted-foreground">
          {partnerNames} — {weddingDate}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-6 no-print">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gasten totaal (incl. +1)</p>
            <p className="font-serif text-2xl font-semibold">{totalGuests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bevestigd (incl. +1)</p>
            <p className="font-serif text-2xl font-semibold">{confirmedTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Met dieetwens</p>
            <p className="font-serif text-2xl font-semibold">{withDiet.length}</p>
          </CardContent>
        </Card>
      </div>

      {categoryCounts.length > 0 ? (
        <section className="mb-8">
          <h2 className="font-serif text-lg font-semibold mb-3">Samenvatting</h2>
          <div className="flex flex-wrap gap-2">
            {categoryCounts.map(([label, n]) => (
              <span
                key={label}
                className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
              >
                {label}: {n}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <h2 className="font-serif text-lg font-semibold mb-3">Per gast</h2>
      {withDiet.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Geen dieetwensen"
          description="Zodra gasten via RSVP iets doorgeven, verschijnt het hier."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Gast</th>
                <th className="text-left px-3 py-2 font-medium">+1</th>
                <th className="text-left px-3 py-2 font-medium">Wens</th>
              </tr>
            </thead>
            <tbody>
              {withDiet.map((g) => (
                <tr key={g.id} className="border-t align-top">
                  <td className="px-3 py-2 font-medium">
                    {[g.first_name, g.last_name].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {g.plus_one ? g.plus_one_name || "+1" : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-line">{g.dietary_wishes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
