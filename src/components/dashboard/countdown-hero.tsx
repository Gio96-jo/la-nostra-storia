"use client";

import { useEffect, useState } from "react";
import { formatDateNL } from "@/lib/utils";
import { MapPin, Heart } from "lucide-react";

function getCountdown(weddingDate: string) {
  const target = new Date(weddingDate + "T00:00:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { passed: false, days, hours, minutes, seconds };
}

interface Props {
  weddingDate: string;
  partnerOne: string;
  partnerTwo: string;
  venueName?: string | null;
  city?: string | null;
}

export function CountdownHero({ weddingDate, partnerOne, partnerTwo, venueName, city }: Props) {
  const [c, setC] = useState(() => getCountdown(weddingDate));

  useEffect(() => {
    const id = setInterval(() => setC(getCountdown(weddingDate)), 1000);
    return () => clearInterval(id);
  }, [weddingDate]);

  return (
    <div className="relative overflow-hidden rounded-2xl border romantic-gradient p-6 sm:p-10 text-center">
      <div className="absolute top-4 right-4 hidden sm:block opacity-30">
        <Heart className="h-16 w-16 text-primary" fill="currentColor" />
      </div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">De grote dag</p>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold">
        {partnerOne} <span className="text-primary">&</span> {partnerTwo}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{formatDateNL(weddingDate)}</p>
      {venueName ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {venueName}{city ? `, ${city}` : ""}
        </p>
      ) : null}

      {c.passed ? (
        <p className="mt-6 font-serif text-2xl text-primary">Gefeliciteerd! Jullie zijn getrouwd 💍</p>
      ) : (
        <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
          <CountUnit value={c.days} label="dagen" big />
          <CountUnit value={c.hours} label="uur" />
          <CountUnit value={c.minutes} label="min" />
          <CountUnit value={c.seconds} label="sec" />
        </div>
      )}
    </div>
  );
}

function CountUnit({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <div className="rounded-lg bg-card border px-2 py-3 sm:py-4">
      <p className={`font-serif font-semibold tabular-nums ${big ? "text-3xl sm:text-5xl text-primary" : "text-2xl sm:text-3xl"}`}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
