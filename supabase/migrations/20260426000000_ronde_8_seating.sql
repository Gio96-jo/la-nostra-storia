-- =====================================================================
-- Ronde 8 — Tafelindeling / Seating plan
--
-- Voegt toe:
--   * seating_tables: tafels per bruiloft (naam, capaciteit, vorm, positie)
--   * guests.seating_table_id: optionele FK naar seating_tables
--   * RLS via public.user_owns_wedding(wedding_id)
-- =====================================================================

create table if not exists public.seating_tables (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings(id) on delete cascade,
  name          text not null,
  capacity      int  not null default 8 check (capacity between 1 and 30),
  shape         text not null default 'round' check (shape in ('round','rectangle')),
  position_x    int  not null default 0,
  position_y    int  not null default 0,
  sort_order    int  not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists seating_tables_wedding_idx
  on public.seating_tables(wedding_id, sort_order);

-- updated_at trigger (same helper als andere tabellen)
drop trigger if exists set_seating_tables_updated_at on public.seating_tables;
create trigger set_seating_tables_updated_at
  before update on public.seating_tables
  for each row execute function public.set_updated_at();

-- RLS
alter table public.seating_tables enable row level security;

drop policy if exists seating_tables_select on public.seating_tables;
create policy seating_tables_select on public.seating_tables
  for select using (public.user_owns_wedding(wedding_id));

drop policy if exists seating_tables_insert on public.seating_tables;
create policy seating_tables_insert on public.seating_tables
  for insert with check (public.user_owns_wedding(wedding_id));

drop policy if exists seating_tables_update on public.seating_tables;
create policy seating_tables_update on public.seating_tables
  for update using (public.user_owns_wedding(wedding_id))
  with check (public.user_owns_wedding(wedding_id));

drop policy if exists seating_tables_delete on public.seating_tables;
create policy seating_tables_delete on public.seating_tables
  for delete using (public.user_owns_wedding(wedding_id));

-- ---------- guests uitbreiden ----------
alter table public.guests
  add column if not exists seating_table_id uuid references public.seating_tables(id) on delete set null;

create index if not exists guests_seating_table_idx
  on public.guests(seating_table_id)
  where seating_table_id is not null;
