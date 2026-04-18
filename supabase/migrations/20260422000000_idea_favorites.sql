-- La Nostra Storia — Ronde 4
-- Ideeën-favorieten per bruiloft. idea_id is een slug/string (de ideeën
-- zelf zitten statisch in de frontend, dus geen FK).

create table if not exists public.idea_favorites (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  idea_id    text not null,
  created_at timestamptz not null default now(),
  primary key (wedding_id, idea_id)
);

create index if not exists idea_favorites_wedding_idx on public.idea_favorites(wedding_id);

alter table public.idea_favorites enable row level security;

-- Hergebruik helper public.user_owns_wedding — al aanwezig in initial_schema
drop policy if exists "idea_favorites_select_own" on public.idea_favorites;
drop policy if exists "idea_favorites_insert_own" on public.idea_favorites;
drop policy if exists "idea_favorites_delete_own" on public.idea_favorites;

create policy "idea_favorites_select_own" on public.idea_favorites
  for select using (public.user_owns_wedding(wedding_id));
create policy "idea_favorites_insert_own" on public.idea_favorites
  for insert with check (public.user_owns_wedding(wedding_id));
create policy "idea_favorites_delete_own" on public.idea_favorites
  for delete using (public.user_owns_wedding(wedding_id));
