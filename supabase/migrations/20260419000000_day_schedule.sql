-- La Nostra Storia — Dagplanning (trouwdag uur-per-uur + kaart)
-- Nieuwe tabel day_schedule_items voor activiteiten op de trouwdag
-- met optionele locatie (adres + lat/lng voor op de kaart).

create table if not exists public.day_schedule_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  start_time time not null,
  end_time time,
  title text not null,
  description text,
  location_name text,
  address text,
  lat double precision,
  lng double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists day_schedule_items_wedding_time_idx
  on public.day_schedule_items (wedding_id, start_time);

-- updated_at trigger
drop trigger if exists trg_day_schedule_updated_at on public.day_schedule_items;
create trigger trg_day_schedule_updated_at
  before update on public.day_schedule_items
  for each row execute function public.set_updated_at();

-- RLS
alter table public.day_schedule_items enable row level security;

drop policy if exists "day_schedule_items_select_own" on public.day_schedule_items;
drop policy if exists "day_schedule_items_insert_own" on public.day_schedule_items;
drop policy if exists "day_schedule_items_update_own" on public.day_schedule_items;
drop policy if exists "day_schedule_items_delete_own" on public.day_schedule_items;

create policy "day_schedule_items_select_own" on public.day_schedule_items
  for select using (public.user_owns_wedding(wedding_id));
create policy "day_schedule_items_insert_own" on public.day_schedule_items
  for insert with check (public.user_owns_wedding(wedding_id));
create policy "day_schedule_items_update_own" on public.day_schedule_items
  for update using (public.user_owns_wedding(wedding_id))
  with check (public.user_owns_wedding(wedding_id));
create policy "day_schedule_items_delete_own" on public.day_schedule_items
  for delete using (public.user_owns_wedding(wedding_id));
