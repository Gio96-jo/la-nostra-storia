-- =====================================================================
-- Ronde 9 — Muziekwensen van gasten
--
-- Voegt toe:
--   * music_requests: per-bruiloft muziekwensen (naam gast, titel, artiest,
--     spotify-url, notitie)
--   * SECURITY DEFINER RPC public_submit_music_request(p_token, ...) die
--     een nieuwe wens aanmaakt via het RSVP-token van een gast
--   * RLS: alleen eigenaar ziet de muziekwensen van zijn bruiloft
-- =====================================================================

create table if not exists public.music_requests (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings(id) on delete cascade,
  guest_id      uuid references public.guests(id) on delete set null,
  guest_name    text not null,
  song_title    text not null,
  artist        text,
  spotify_url   text,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists music_requests_wedding_idx
  on public.music_requests(wedding_id, created_at desc);

alter table public.music_requests enable row level security;

drop policy if exists music_requests_select on public.music_requests;
create policy music_requests_select on public.music_requests
  for select using (public.user_owns_wedding(wedding_id));

drop policy if exists music_requests_delete on public.music_requests;
create policy music_requests_delete on public.music_requests
  for delete using (public.user_owns_wedding(wedding_id));

-- Geen insert/update-policies: aanmaken alleen via RPC (security definer).

-- ---------- Publieke RPC: muziekwens indienen via RSVP-token ----------
create or replace function public.public_submit_music_request(
  p_token       text,
  p_song_title  text,
  p_artist      text default null,
  p_spotify_url text default null,
  p_note        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  new_id uuid;
begin
  if p_song_title is null or length(trim(p_song_title)) = 0 then
    raise exception 'song_title_required';
  end if;

  select * into g from public.guests where rsvp_token = p_token limit 1;
  if not found then
    raise exception 'invalid_token';
  end if;

  insert into public.music_requests (
    wedding_id, guest_id, guest_name, song_title, artist, spotify_url, note
  ) values (
    g.wedding_id,
    g.id,
    trim(coalesce(g.first_name, '') || ' ' || coalesce(g.last_name, '')),
    trim(p_song_title),
    nullif(trim(coalesce(p_artist, '')), ''),
    nullif(trim(coalesce(p_spotify_url, '')), ''),
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.public_submit_music_request(text, text, text, text, text)
  to anon, authenticated;
