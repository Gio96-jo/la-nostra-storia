import { Heart, MapPin, UtensilsCrossed, Shirt, CalendarHeart } from "lucide-react";
import { themeToCss } from "@/lib/themes";
import { formatDateNL } from "@/lib/utils";
import type { WeddingTheme } from "@/lib/types";

interface PublicWedding {
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string;
  venue_name: string | null;
  city: string | null;
  theme: WeddingTheme;
  public_story: string | null;
  public_menu: string | null;
  public_dress_code: string | null;
  public_rsvp_deadline: string | null;
  public_hero_subtitle: string | null;
  public_address: string | null;
  public_slug?: string | null;
  public_enabled?: boolean;
}

interface PublicScheduleItem {
  id: string;
  start_time: string;
  end_time: string | null;
  title: string;
  description: string | null;
  location_name: string | null;
  address: string | null;
  is_evening_only?: boolean;
}

export interface PublicWeddingData {
  wedding: PublicWedding;
  schedule: PublicScheduleItem[];
}

function timeShort(t: string | null | undefined) {
  if (!t) return "";
  // t is "HH:MM:SS" or "HH:MM"
  return t.slice(0, 5);
}

export function PublicWeddingSite({
  data,
  rsvpSlot = null,
}: {
  data: PublicWeddingData;
  rsvpSlot?: React.ReactNode;
}) {
  const { wedding, schedule } = data;
  const themeCss = themeToCss(wedding.theme);
  const names = `${wedding.partner_one_name} & ${wedding.partner_two_name}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <header className="romantic-gradient border-b">
          <div className="container max-w-3xl py-16 sm:py-24 text-center">
            <Heart className="mx-auto h-8 w-8 text-primary mb-4" fill="currentColor" />
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
              {names}
            </h1>
            {wedding.public_hero_subtitle ? (
              <p className="mt-3 text-base text-muted-foreground italic">
                {wedding.public_hero_subtitle}
              </p>
            ) : null}
            <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarHeart className="h-4 w-4" />
              {formatDateNL(wedding.wedding_date)}
            </p>
            {wedding.venue_name || wedding.city ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[wedding.venue_name, wedding.city].filter(Boolean).join(" — ")}
              </p>
            ) : null}
          </div>
        </header>

        <main className="container max-w-3xl py-10 space-y-12">
          {rsvpSlot}

          {wedding.public_story ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-3">Ons verhaal</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {wedding.public_story}
              </p>
            </section>
          ) : null}

          {schedule.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-4">Programma</h2>
              <ol className="space-y-3">
                {schedule.map((s) => (
                  <li
                    key={s.id}
                    className="flex gap-4 rounded-lg border bg-card p-4"
                  >
                    <div className="w-16 shrink-0 text-sm font-medium text-primary">
                      {timeShort(s.start_time)}
                      {s.end_time ? (
                        <span className="block text-xs text-muted-foreground">
                          t/m {timeShort(s.end_time)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base font-semibold leading-tight">
                        {s.title}
                      </p>
                      {s.description ? (
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                      ) : null}
                      {s.location_name || s.address ? (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[s.location_name, s.address].filter(Boolean).join(" — ")}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {wedding.public_menu ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-3 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Menu
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {wedding.public_menu}
              </p>
            </section>
          ) : null}

          {wedding.public_dress_code ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-3 flex items-center gap-2">
                <Shirt className="h-5 w-5 text-primary" />
                Dresscode
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {wedding.public_dress_code}
              </p>
            </section>
          ) : null}

          {wedding.public_address ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Adres
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {wedding.public_address}
              </p>
            </section>
          ) : null}
        </main>

        <footer className="border-t">
          <div className="container max-w-3xl py-6 text-center text-xs text-muted-foreground">
            Met liefde gemaakt — {names}
          </div>
        </footer>
      </div>
    </>
  );
}
