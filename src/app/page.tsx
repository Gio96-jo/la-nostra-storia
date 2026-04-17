import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { ListChecks, Wallet, Users, Building2, CalendarDays, NotebookPen, Heart, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: ListChecks, title: "Checklist per fase", desc: "Meer dan 50 taken, automatisch gepland van 12+ maanden tot de dag zelf." },
  { icon: Wallet, title: "Budget tracker", desc: "Houd grip op de kosten per categorie. Zie direct waar je staat." },
  { icon: Users, title: "Gastenlijst & RSVP", desc: "Beheer gasten, dieetwensen en tafelindeling. Exporteer naar CSV." },
  { icon: Building2, title: "Leveranciers", desc: "Locatie, fotograaf, DJ — alle contacten en offertes op één plek." },
  { icon: CalendarDays, title: "Tijdlijn", desc: "Zie maand voor maand wat er aan komt. Geen verrassingen." },
  { icon: NotebookPen, title: "Notities & Inspiratie", desc: "Bewaar links, ideeën en Pinterest-borden samen." },
];

export default function LandingPage() {
  return (
    <div className="romantic-gradient min-h-screen">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          <span className="font-serif text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/login">Inloggen</Link></Button>
          <Button asChild><Link href="/registreren">Begin gratis</Link></Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="container py-16 sm:py-24 text-center max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3 w-3" /> Jullie verhaal begint hier
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl font-semibold tracking-tight">
          Plan jullie bruiloft.<br />
          <span className="text-primary">Zonder stress.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {APP_NAME} begeleidt jullie van de eerste droom tot de laatste dans.
          Een complete trouwplanner — gemaakt voor verloofde stellen.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg"><Link href="/registreren">Maak gratis een account</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/login">Ik heb al een account</Link></Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Geen creditcard nodig · Volledig in het Nederlands</p>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-hover rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl bg-card p-10 shadow-lg border">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold">Klaar om te beginnen?</h2>
          <p className="mt-3 text-muted-foreground">Een account aanmaken duurt minder dan een minuut.</p>
          <Button asChild size="lg" className="mt-6"><Link href="/registreren">Start nu</Link></Button>
        </div>
      </section>

      <footer className="container py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Met liefde gemaakt.
      </footer>
    </div>
  );
}
