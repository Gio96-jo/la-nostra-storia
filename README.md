# La Nostra Storia

Een complete Nederlandse trouwplanner-SaaS voor verloofde stellen. Begeleidt het stel van de eerste droom tot de laatste dans — checklist, budget, gastenlijst, leveranciers, tijdlijn en notities.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (auth + Postgres + RLS), **shadcn/ui** primitives, and **Recharts**.

---

## Features

- 🔐 **Authenticatie** — registreren, inloggen, wachtwoord reset (Supabase Auth)
- 🪄 **Onboarding-wizard** — partner-namen, datum, budget, gasten, locatie
- 📅 **Dashboard** — live countdown, voortgang, quick stats, aankomende taken
- ✅ **Checklist** — 50+ vooraf ingevulde taken in 8 fases, automatisch gepland op basis van trouwdatum, eigen taken toevoegen, print/PDF
- 💰 **Budget** — totaal budget, posten per categorie, betaald/onbetaald, pie-chart, waarschuwing bij overschrijding
- 👥 **Gastenlijst** — RSVP-status, dieetwensen, tafelindeling, +1, CSV-export
- 🏛 **Leveranciers** — contact, status (contact/offerte/geboekt/betaald), gekoppeld aan budget
- 🗓 **Tijdlijn** — visuele maand-voor-maand view tot de grote dag
- 📌 **Notities & inspiratie** — vrije notities met links (Pinterest, locaties, etc.)
- 🌗 **Dark mode** + volledig responsive (mobile-first)
- 🛡 **Row Level Security** — elk stel ziet alleen hun eigen data

---

## Tech stack

| Onderdeel | Keuze |
|---|---|
| Framework | Next.js 14 (App Router, RSC) |
| Taal | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (custom blush/ivory/sage palette) |
| Database / Auth | Supabase (Postgres + Auth + RLS) |
| Charts | Recharts |
| Forms / Validatie | Native + Zod (toegankelijk via `@hookform/resolvers`) |
| Icons | lucide-react |
| Toasts | sonner |
| Theming | next-themes |
| Deployment | Vercel |

---

## Project structure

```
la-nostra-storia/
├── src/
│   ├── app/
│   │   ├── (app)/                 # Route group — protected app pages share layout
│   │   │   ├── layout.tsx         # Sidebar + topbar shell
│   │   │   ├── dashboard/
│   │   │   ├── checklist/
│   │   │   ├── budget/
│   │   │   ├── gasten/
│   │   │   ├── leveranciers/
│   │   │   ├── tijdlijn/
│   │   │   ├── notities/
│   │   │   └── instellingen/
│   │   ├── auth/                  # OAuth callback + signout
│   │   ├── login/
│   │   ├── registreren/
│   │   ├── reset-wachtwoord/
│   │   ├── nieuwe-wachtwoord/
│   │   ├── onboarding/
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn-style primitives
│   │   ├── auth/, app/, dashboard/, checklist/, budget/, guests/, suppliers/, timeline/, notes/, settings/, onboarding/
│   ├── lib/
│   │   ├── supabase/              # client, server, middleware
│   │   ├── constants.ts           # categories, phases, RSVP, etc.
│   │   ├── types.ts               # Database + domain types
│   │   ├── utils.ts               # formatters
│   │   └── wedding.ts             # getCurrentWedding helper
│   └── ...
├── supabase/
│   └── migrations/
│       └── 20260417000000_initial_schema.sql
├── middleware.ts                  # Auth guard
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 1 — Supabase project setup

1. Maak een account aan op [supabase.com](https://supabase.com) en start een nieuw project. Kies een sterke database password.
2. Wacht tot het project provisioned is.
3. Open in het Supabase dashboard **Project Settings → API** en kopieer:
   - `Project URL` → wordt `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` API key → wordt `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database schema

Voer de SQL-migratie uit in **SQL Editor → New query**:

1. Open `supabase/migrations/20260417000000_initial_schema.sql`
2. Plak de volledige inhoud in de SQL Editor
3. Klik **Run**

Dit maakt:
- 6 tabellen (`weddings`, `checklist_items`, `suppliers`, `budget_items`, `guests`, `notes`)
- Enums voor fases, categorieën, RSVP, supplier status
- Row Level Security policies (elk stel ziet alleen eigen data)
- Een trigger die automatisch 50+ checklist-taken seed't met deadlines berekend vanuit de trouwdatum, zodra het stel een wedding aanmaakt

Optioneel via Supabase CLI:
```bash
supabase link --project-ref <jouw-project-ref>
supabase db push
```

### Auth setup

In het Supabase dashboard, **Authentication → Providers**:
- Enable **Email** (default aan).
- Optioneel: zet **Confirm email** uit voor sneller testen, of laat aan voor productie.

In **Authentication → URL Configuration**:
- Site URL: `https://your-domain.com` (of `http://localhost:3000` voor lokaal)
- Additional Redirect URLs: voeg `https://your-domain.com/auth/callback` toe (en `http://localhost:3000/auth/callback`)

### Email templates (optioneel)

In **Authentication → Email Templates** kun je de Nederlandse vertaling activeren. Voorbeeld voor "Reset password":

> Onderwerp: `Reset jullie wachtwoord — La Nostra Storia`
>
> Klik op de onderstaande link om een nieuw wachtwoord in te stellen: `{{ .ConfirmationURL }}`

---

## 2 — Lokaal draaien

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Vul in:
#   NEXT_PUBLIC_SUPABASE_URL=
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Eerste run-flow

1. Klik **Begin gratis** → registreer met e-mail + wachtwoord
2. (als email-confirmation aan staat) bevestig via je inbox
3. Doorloop de onboarding-wizard (4 stappen)
4. Je dashboard is direct gevuld met de seed-checklist

---

## 3 — Deployen naar Vercel

1. Push deze repo naar GitHub.
2. Ga naar [vercel.com/new](https://vercel.com/new) en importeer de repo.
3. Voeg de environment variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (bijv. `https://lanostrastoria.nl`)
4. Deploy.
5. **Belangrijk**: voeg de Vercel-URL toe aan Supabase → Authentication → URL Configuration:
   - Site URL: jouw Vercel-domein
   - Redirect URLs: `https://<vercel-url>/auth/callback`

Klaar! Je app is live.

---

## Database schema (samenvatting)

```
weddings           1:1 met auth.users (uniek owner_id)
  ├─ checklist_items  *  (auto-seeded via trigger)
  ├─ suppliers        *
  ├─ budget_items     *  (optioneel gelinkt aan supplier)
  ├─ guests           *
  └─ notes            *
```

Alle child-tabellen hebben een `wedding_id` foreign key met `on delete cascade` en RLS-policies die `user_owns_wedding(wedding_id)` afdwingen.

---

## Development scripts

```bash
npm run dev          # Local dev server
npm run build        # Production build
npm run start        # Run production build
npm run lint         # ESLint
npm run typecheck    # TypeScript without emit
```

---

## Roadmap (nice-to-haves)

- [ ] Email-reminders via Supabase Edge Functions (cron op `due_date`)
- [ ] Trouw-website / RSVP-pagina genereren per stel
- [ ] PDF-export checklist als één-pager
- [ ] Mede-planner toevoegen (tweede gebruiker per wedding)
- [ ] Templates voor verschillende stijlen (klassiek/bohemian/etc.)
- [ ] Stripe-integratie voor betalend abonnement

---

## License

Private / proprietary. © La Nostra Storia.
