-- =====================================================================
-- La Nostra Storia — Initial Schema
-- Wedding planner SaaS for couples
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type wedding_phase as enum (
  'twaalf_plus_maanden',
  'negen_tot_twaalf_maanden',
  'zes_tot_negen_maanden',
  'drie_tot_zes_maanden',
  'een_tot_drie_maanden',
  'een_maand_tot_een_week',
  'laatste_week',
  'op_de_dag_zelf'
);

create type task_category as enum (
  'locatie',
  'catering',
  'fotografie',
  'muziek',
  'bloemen',
  'kleding',
  'uitnodigingen',
  'huwelijksreis',
  'administratie',
  'overig'
);

create type rsvp_status as enum (
  'uitgenodigd',
  'bevestigd',
  'afgemeld',
  'in_afwachting'
);

create type guest_relation as enum (
  'familie_bruid',
  'familie_bruidegom',
  'vrienden',
  'collegas',
  'overig'
);

create type supplier_status as enum (
  'contact_opgenomen',
  'offerte_ontvangen',
  'geboekt',
  'betaald'
);

-- ---------- Tables ----------

-- A wedding is the top-level workspace. One per account (enforced by unique owner_id).
create table public.weddings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_one_name text not null,
  partner_two_name text not null,
  wedding_date date not null,
  estimated_budget numeric(12, 2),
  estimated_guest_count integer,
  venue_name text,
  city text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.checklist_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  description text,
  category task_category not null default 'overig',
  phase wedding_phase not null,
  due_date date,
  is_completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.checklist_items (wedding_id, phase, sort_order);
create index on public.checklist_items (wedding_id, due_date);

create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category task_category not null default 'overig',
  contact_person text,
  email text,
  phone text,
  website text,
  agreed_price numeric(12, 2),
  status supplier_status not null default 'contact_opgenomen',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.suppliers (wedding_id);

create table public.budget_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  category task_category not null default 'overig',
  description text not null,
  estimated_cost numeric(12, 2) not null default 0,
  actual_cost numeric(12, 2),
  is_paid boolean not null default false,
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.budget_items (wedding_id);
create index on public.budget_items (supplier_id);

create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  relation guest_relation not null default 'overig',
  table_group text,
  rsvp_status rsvp_status not null default 'uitgenodigd',
  dietary_wishes text,
  plus_one boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.guests (wedding_id, rsvp_status);

create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  content text,
  link_url text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notes (wedding_id, pinned desc, created_at desc);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();
create trigger trg_checklist_updated_at before update on public.checklist_items
  for each row execute function public.set_updated_at();
create trigger trg_suppliers_updated_at before update on public.suppliers
  for each row execute function public.set_updated_at();
create trigger trg_budget_updated_at before update on public.budget_items
  for each row execute function public.set_updated_at();
create trigger trg_guests_updated_at before update on public.guests
  for each row execute function public.set_updated_at();
create trigger trg_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------- completed_at trigger ----------
create or replace function public.set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_completed and (old.is_completed is distinct from true) then
    new.completed_at = now();
  elsif not new.is_completed then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_checklist_completed_at before update on public.checklist_items
  for each row execute function public.set_completed_at();

-- =====================================================================
-- Checklist seed: when a wedding is created, populate the standard
-- 50+ task checklist with auto-calculated due dates.
-- =====================================================================

create or replace function public.seed_checklist_for_wedding(p_wedding_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w_date date;
begin
  select wedding_date into w_date from public.weddings where id = p_wedding_id;
  if w_date is null then
    return;
  end if;

  insert into public.checklist_items
    (wedding_id, title, description, category, phase, due_date, sort_order)
  values
  -- =========== 12+ maanden voor de bruiloft ===========
  (p_wedding_id, 'Bepaal jullie droomdatum', 'Kies een datum die voor jullie beiden bijzonder is. Houd rekening met seizoen, vakanties en beschikbaarheid van familie.', 'administratie', 'twaalf_plus_maanden', w_date - interval '14 months', 10),
  (p_wedding_id, 'Stel een eerste budget op', 'Bespreek samen wat jullie maximaal willen uitgeven. Een gemiddelde Nederlandse bruiloft kost €15.000 – €30.000.', 'administratie', 'twaalf_plus_maanden', w_date - interval '14 months', 20),
  (p_wedding_id, 'Maak een eerste gastenlijst', 'Maak een grove schatting van het aantal gasten. Dit bepaalt de grootte van jullie locatie en catering.', 'uitnodigingen', 'twaalf_plus_maanden', w_date - interval '13 months', 30),
  (p_wedding_id, 'Brainstorm over de stijl en sfeer', 'Maak een Pinterest-bord, verzamel inspiratie en bepaal de algemene sfeer: klassiek, bohemian, modern, rustiek?', 'overig', 'twaalf_plus_maanden', w_date - interval '13 months', 40),
  (p_wedding_id, 'Kies en boek de ceremonielocatie', 'Of het nu het stadhuis, een kerk of een buitenlocatie is – goede locaties zijn snel volgeboekt.', 'locatie', 'twaalf_plus_maanden', w_date - interval '12 months', 50),
  (p_wedding_id, 'Kies en boek de feestlocatie', 'Bepaal of jullie ceremonie en feest op dezelfde locatie houden of niet. Boek minimaal een jaar van tevoren.', 'locatie', 'twaalf_plus_maanden', w_date - interval '12 months', 60),
  (p_wedding_id, 'Geef het huwelijk door bij de gemeente', 'In Nederland moet je het huwelijk minimaal 2 weken en maximaal 1 jaar vóór de trouwdag melden ("ondertrouw"). Plan dit moment alvast.', 'administratie', 'twaalf_plus_maanden', w_date - interval '12 months', 70),

  -- =========== 9-12 maanden ===========
  (p_wedding_id, 'Boek de fotograaf', 'Goede bruiloftsfotografen zijn vaak een jaar van tevoren volgeboekt. Bekijk portfolios kritisch.', 'fotografie', 'negen_tot_twaalf_maanden', w_date - interval '11 months', 100),
  (p_wedding_id, 'Boek de videograaf (optioneel)', 'Twijfel je nog? Een trouwfilm wordt door bijna iedereen achteraf als waardevol ervaren.', 'fotografie', 'negen_tot_twaalf_maanden', w_date - interval '11 months', 110),
  (p_wedding_id, 'Kies en boek de catering', 'Diner, walking dinner of buffet? Vraag minimaal 3 offertes aan en plan een proeverij.', 'catering', 'negen_tot_twaalf_maanden', w_date - interval '10 months', 120),
  (p_wedding_id, 'Vraag de ceremoniespreker / trouwambtenaar aan', 'Bij de gemeente of een externe BABS (Buitengewoon Ambtenaar van de Burgerlijke Stand) van jullie keuze.', 'administratie', 'negen_tot_twaalf_maanden', w_date - interval '10 months', 130),
  (p_wedding_id, 'Reserveer overnachting voor gasten', 'Als de locatie ver weg is: blokkeer kamers in een nabijgelegen hotel.', 'locatie', 'negen_tot_twaalf_maanden', w_date - interval '10 months', 140),
  (p_wedding_id, 'Stuur save-the-dates', 'Zeker bij een bruiloft in het hoogseizoen of in het buitenland: laat gasten alvast de datum vrijhouden.', 'uitnodigingen', 'negen_tot_twaalf_maanden', w_date - interval '9 months', 150),
  (p_wedding_id, 'Begin met zoeken naar de trouwjurk', 'Reken op meerdere paskamers en 4-6 maanden levertijd voor maatwerk.', 'kleding', 'negen_tot_twaalf_maanden', w_date - interval '9 months', 160),
  (p_wedding_id, 'Begin met zoeken naar het trouwpak', 'Maatpak? Reken op 2-3 maanden. Confectie? Korter, maar plan tijdig in.', 'kleding', 'negen_tot_twaalf_maanden', w_date - interval '9 months', 170),

  -- =========== 6-9 maanden ===========
  (p_wedding_id, 'Boek de DJ of band', 'De live muzieksfeer maakt of breekt je feest. Vraag demo''s en bekijk video''s van eerdere bruiloften.', 'muziek', 'zes_tot_negen_maanden', w_date - interval '8 months', 200),
  (p_wedding_id, 'Boek de bloemist', 'Bespreek bruidsboeket, corsages, tafelstukken en eventueel een bloemenboog of arch.', 'bloemen', 'zes_tot_negen_maanden', w_date - interval '8 months', 210),
  (p_wedding_id, 'Boek de bruidstaart of dessertbar', 'Plan een proeverij in. Houd rekening met allergieën van gasten.', 'catering', 'zes_tot_negen_maanden', w_date - interval '7 months', 220),
  (p_wedding_id, 'Plan en boek de huwelijksreis', 'Vlucht én accommodatie zijn vaak voordeliger als je vroeg boekt. Vergeet je paspoort niet te checken.', 'huwelijksreis', 'zes_tot_negen_maanden', w_date - interval '7 months', 230),
  (p_wedding_id, 'Kies de getuigen', 'In Nederland heb je 2 tot 4 getuigen nodig (minimaal 18 jaar oud).', 'administratie', 'zes_tot_negen_maanden', w_date - interval '7 months', 240),
  (p_wedding_id, 'Bepaal het programma van de dag', 'Maak een grove tijdlijn: ceremonie, fotomoment, receptie, diner, feest. Bespreek dit met je locatie.', 'overig', 'zes_tot_negen_maanden', w_date - interval '6 months', 250),
  (p_wedding_id, 'Kies en bestel trouwringen', 'Levertijd voor maatwerk: 6-8 weken. Kies samen voor iets wat bij jullie past.', 'administratie', 'zes_tot_negen_maanden', w_date - interval '6 months', 260),

  -- =========== 3-6 maanden ===========
  (p_wedding_id, 'Stuur officiële uitnodigingen', 'Stuur ze minimaal 3 maanden voor de bruiloft. Vraag om RSVP binnen 6 weken.', 'uitnodigingen', 'drie_tot_zes_maanden', w_date - interval '5 months', 300),
  (p_wedding_id, 'Maak een trouwwebsite of RSVP-pagina', 'Verzamel hier alle praktische info: route, dresscode, programma, cadeautip.', 'uitnodigingen', 'drie_tot_zes_maanden', w_date - interval '5 months', 310),
  (p_wedding_id, 'Doe ondertrouw bij de gemeente', 'Officieel: melding voorgenomen huwelijk. Doe dit minimaal 2 weken en maximaal 1 jaar voor de trouwdag.', 'administratie', 'drie_tot_zes_maanden', w_date - interval '5 months', 320),
  (p_wedding_id, 'Boek vervoer voor de trouwdag', 'Trouwauto, oldtimer, koets of bus voor gasten? Reserveer ruim van tevoren.', 'overig', 'drie_tot_zes_maanden', w_date - interval '4 months', 330),
  (p_wedding_id, 'Plan vrijgezellenfeest met getuigen', 'Bespreek het concept met je getuigen — zij organiseren meestal alles.', 'overig', 'drie_tot_zes_maanden', w_date - interval '4 months', 340),
  (p_wedding_id, 'Eerste pasafspraak voor jurk en pak', 'Plan minimaal 2-3 pasafspraken in voor aanpassingen.', 'kleding', 'drie_tot_zes_maanden', w_date - interval '4 months', 350),
  (p_wedding_id, 'Boek hair & make-up artist', 'Boek een proefsessie ongeveer 1 maand voor de bruiloft.', 'kleding', 'drie_tot_zes_maanden', w_date - interval '4 months', 360),
  (p_wedding_id, 'Stel een muziekwensenlijst op', 'Welke nummers moeten écht gespeeld worden? En welke écht niet? Deel dit met je DJ.', 'muziek', 'drie_tot_zes_maanden', w_date - interval '3 months', 370),

  -- =========== 1-3 maanden ===========
  (p_wedding_id, 'Verzamel alle RSVP''s', 'Bel of mail gasten die nog niet hebben gereageerd. Definitief aantal nodig voor catering.', 'uitnodigingen', 'een_tot_drie_maanden', w_date - interval '8 weeks', 400),
  (p_wedding_id, 'Maak een definitieve tafelindeling', 'Houd rekening met relaties tussen gasten, dieetwensen en kinderen.', 'uitnodigingen', 'een_tot_drie_maanden', w_date - interval '6 weeks', 410),
  (p_wedding_id, 'Bestel naamkaartjes en menukaarten', 'Of maak ze zelf. Voeg eventueel een tafelplattegrond toe bij de ingang.', 'uitnodigingen', 'een_tot_drie_maanden', w_date - interval '6 weeks', 420),
  (p_wedding_id, 'Schrijf en oefen jullie geloften', 'Persoonlijke geloften maken het moment extra bijzonder. Geef de spreker een kopie.', 'overig', 'een_tot_drie_maanden', w_date - interval '6 weeks', 430),
  (p_wedding_id, 'Bevestig alle leveranciers', 'Tijden, locaties, contactgegevens — zet alles op papier en stuur het door.', 'overig', 'een_tot_drie_maanden', w_date - interval '5 weeks', 440),
  (p_wedding_id, 'Definitieve pasbeurt jurk en pak', 'Laatste aanpassingen. Neem schoenen en accessoires mee voor het complete plaatje.', 'kleding', 'een_tot_drie_maanden', w_date - interval '4 weeks', 450),
  (p_wedding_id, 'Bestel bedankjes voor gasten', 'Iets kleins als herinnering: chocolade, bloemzaadjes, mini wijntje.', 'overig', 'een_tot_drie_maanden', w_date - interval '4 weeks', 460),
  (p_wedding_id, 'Plan een proefsessie hair & make-up', 'Test de complete look. Maak foto''s om te zien hoe het eruitziet op de camera.', 'kleding', 'een_tot_drie_maanden', w_date - interval '4 weeks', 470),

  -- =========== 1 maand - 1 week ===========
  (p_wedding_id, 'Geef definitieve gastenaantal door aan catering', 'Ook dieetwensen en allergieën doorgeven.', 'catering', 'een_maand_tot_een_week', w_date - interval '3 weeks', 500),
  (p_wedding_id, 'Maak een dagschema voor leveranciers', 'Een minuut-voor-minuut planning met contactgegevens. Deel met fotograaf, DJ, locatie en getuigen.', 'overig', 'een_maand_tot_een_week', w_date - interval '3 weeks', 510),
  (p_wedding_id, 'Maak een fotoshotlist', 'Lijst met must-have foto''s: familiegroepen, details, specifieke momenten. Deel met fotograaf.', 'fotografie', 'een_maand_tot_een_week', w_date - interval '2 weeks', 520),
  (p_wedding_id, 'Pak de huwelijksreiskoffer', 'Check paspoorten, visa, vaccinaties en valuta. Stop alles in handbagage wat je niet kwijt wilt.', 'huwelijksreis', 'een_maand_tot_een_week', w_date - interval '2 weeks', 530),
  (p_wedding_id, 'Haal de trouwringen op', 'Bewaar ze op een veilige plek tot de dag zelf.', 'administratie', 'een_maand_tot_een_week', w_date - interval '2 weeks', 540),
  (p_wedding_id, 'Bevestig hotelovernachting voor de avond zelf', 'Voor jezelf: een mooie suite om de bruiloftsnacht door te brengen.', 'locatie', 'een_maand_tot_een_week', w_date - interval '2 weeks', 550),
  (p_wedding_id, 'Schrijf bedankjes voor speeches', 'Bedankje voor ouders, getuigen, en iedereen die bijdraagt op de dag.', 'overig', 'een_maand_tot_een_week', w_date - interval '10 days', 560),

  -- =========== Laatste week ===========
  (p_wedding_id, 'Doe een laatste check met alle leveranciers', 'Bel of mail iedereen om de laatste details te bevestigen.', 'overig', 'laatste_week', w_date - interval '6 days', 600),
  (p_wedding_id, 'Bereid contante bedragen voor', 'Voor fooi en eventuele cash-only leveranciers. Stop in genummerde enveloppen.', 'administratie', 'laatste_week', w_date - interval '5 days', 610),
  (p_wedding_id, 'Pas alles nog één keer', 'Jurk, pak, schoenen, accessoires. Heeft iemand iets nodig om zich op te poetsen?', 'kleding', 'laatste_week', w_date - interval '4 days', 620),
  (p_wedding_id, 'Manicure / pedicure / kapper', 'Plan ontspanmomenten in. Geef je lichaam rust voor de grote dag.', 'kleding', 'laatste_week', w_date - interval '3 days', 630),
  (p_wedding_id, 'Slaap goed en blijf gehydrateerd', 'Geen last-minute stress. Vertrouw op de planning.', 'overig', 'laatste_week', w_date - interval '2 days', 640),
  (p_wedding_id, 'Pak een noodtas: pleisters, naald & draad, deodorant, snacks', 'Geef deze aan een getuige om mee te nemen.', 'overig', 'laatste_week', w_date - interval '2 days', 650),

  -- =========== Op de dag zelf ===========
  (p_wedding_id, 'Ontbijt samen rustig', 'Eet iets stevigs — het wordt een lange dag.', 'overig', 'op_de_dag_zelf', w_date, 700),
  (p_wedding_id, 'Hair & make-up sessie', 'Plan deze ruim voor de ceremonie in.', 'kleding', 'op_de_dag_zelf', w_date, 710),
  (p_wedding_id, 'Geef ringen aan getuigen', 'Of aan een ringbeveiliger / ringkussentje.', 'administratie', 'op_de_dag_zelf', w_date, 720),
  (p_wedding_id, 'Geniet van elk moment', 'De dag vliegt voorbij. Neem af en toe samen even een momentje voor jezelf.', 'overig', 'op_de_dag_zelf', w_date, 730);
end;
$$;

-- Trigger to auto-seed on wedding insert
create or replace function public.handle_new_wedding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_checklist_for_wedding(new.id);
  return new;
end;
$$;

create trigger trg_seed_checklist_after_wedding_insert
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.weddings        enable row level security;
alter table public.checklist_items enable row level security;
alter table public.suppliers       enable row level security;
alter table public.budget_items    enable row level security;
alter table public.guests          enable row level security;
alter table public.notes           enable row level security;

-- Helper: returns true when the current user owns the given wedding
create or replace function public.user_owns_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.weddings w
    where w.id = p_wedding_id and w.owner_id = auth.uid()
  );
$$;

-- weddings policies
create policy "weddings_select_own" on public.weddings
  for select using (owner_id = auth.uid());
create policy "weddings_insert_own" on public.weddings
  for insert with check (owner_id = auth.uid());
create policy "weddings_update_own" on public.weddings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "weddings_delete_own" on public.weddings
  for delete using (owner_id = auth.uid());

-- Generic policies for the child tables: must own parent wedding
do $$
declare
  t text;
begin
  foreach t in array array['checklist_items','suppliers','budget_items','guests','notes']
  loop
    execute format($f$
      create policy "%1$s_select_own" on public.%1$s
        for select using (public.user_owns_wedding(wedding_id));
      create policy "%1$s_insert_own" on public.%1$s
        for insert with check (public.user_owns_wedding(wedding_id));
      create policy "%1$s_update_own" on public.%1$s
        for update using (public.user_owns_wedding(wedding_id))
        with check (public.user_owns_wedding(wedding_id));
      create policy "%1$s_delete_own" on public.%1$s
        for delete using (public.user_owns_wedding(wedding_id));
    $f$, t);
  end loop;
end$$;
