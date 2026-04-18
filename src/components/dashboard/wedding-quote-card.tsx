"use client";

import { useEffect, useState } from "react";
import { Quote, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WEDDING_QUOTES, quoteOfTheDay, type WeddingQuote } from "@/lib/wedding-quotes";

export function WeddingQuoteCard() {
  const [q, setQ] = useState<WeddingQuote>(() => WEDDING_QUOTES[0]);

  useEffect(() => {
    setQ(quoteOfTheDay());
  }, []);

  function another() {
    let next = q;
    // vermijd dezelfde quote twee keer achter elkaar
    while (next.text === q.text && WEDDING_QUOTES.length > 1) {
      next = WEDDING_QUOTES[Math.floor(Math.random() * WEDDING_QUOTES.length)];
    }
    setQ(next);
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Quote className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
            {q.author ? (
              <p className="mt-2 text-xs text-muted-foreground">— {q.author}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={another}
            title="Nog een quote"
            aria-label="Nog een quote"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
