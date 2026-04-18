-- =====================================================================
-- Ronde 6 — Publieke bruiloftssite + RSVP
--
-- Voegt toe:
--   * weddings: public_slug + public_enabled + publieke tekst-velden
--   * day_schedule_items: is_public, is_evening_only
--   * guests: invite_type (full_day | evening_only) + rsvp_token + extra RSVP-velden
--   * SECURITY DEFINER RPC's voor publieke toegang zonder auth:
--       public_get_wedding_by_slug(slug)   -> wedding + publieke dagplanning
--       public_get_rsvp(token)             -> wedding + guest + dagplanning per invite_type
--       public_submit_rsvp(...)            -> werkt guest-row bij op basis van token
--
--   Alle RPC's zijn bereikbaar voor anon en authenticated — RLS op de
--   onderliggende tabellen blijft ongewijzigd (tabel-toegang voor anon
--   wordt NIET geopend). De RPC's controleren zelf of een bruiloft publiek
--   staat of een token geldig is.
-- =====================================================================

-- ---------- weddings uitbreiden ----------
alter table public.weddings
  add column if not exists public_enabled        boolean not null default false,
  add column if not exists public_slug           text unique,
  add column if not exists public_story          text,
  add column if not exists public_menu           text,
  add column if not exists public_dress_code     text,
  add column if not exists public_rsvp_deadline  date,
  add column if not exists public_hero_subtitle  text,
  add column if not exists public_address        text;

-- slug-vorm validatie: alleen kleine letters, cijfers en koppeltekens, 3-40 tekens
alter table public.weddings
  drop constraint if exists weddings_public_slug_format_chk;
alter table public.weddings
  add  constraint weddings_public_slug_format_chk
  check (public_slug is null or public_slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$');

-- ---------- day_schedule_items uitbreiden ----------
alter table public.day_schedule_items
  add column if not exists is_public       boolean not null default false,
  add column if not exists is_evening_only boolean not null default false;

create index if not exists day_schedule_items_public_idx
  on public.day_schedule_items(wedding_id, is_public)
  where is_public = true;

-- ---------- guests uitbreiden ----------
alter table public.guests
  add column if not exists invite_type    text not null default 'full_day'
                          check (invite_type in ('full_day','evening_only')),
  add column if not exists rsvp_token     text unique,
  add column if not exists plus_one_name  text,
  add column if not exists rsvp_submitted_at timestamptz;

-- Genereer tokens voor bestaande guests (idempotent)
update public.guests
set rsvp_token = encode(gen_random_bytes(16), 'hex')
where rsvp_token is null;

-- Zorg dat nieuwe guests automatisch een token krijgen
create or replace function public.guests_ensure_rsvp_token()
returns trigger
language plpgsql
as $$
begin
  if new.rsvp_token is null or length(new.rsvp_token) = 0 then
    new.rsvp_token := encode(gen_random_bytes(16), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists guests_ensure_rsvp_token_trg on public.guests;
create trigger guests_ensure_rsvp_token_trg
  before insert on public.guests
  for each row
  execute function public.guests_ensure_rsvp_token();

-- ---------- Publieke RPC: bruiloftssite ----------
create or replace function public.public_get_wedding_by_slug(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
  schedule jsonb;
begin
  select *
    into w
    from public.weddings
   where public_slug = p_slug
     and public_enabled = true
   limit 1;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.start_time, s.sort_order), '[]'::jsonb)
    into schedule
    from public.day_schedule_items s
   where s.wedding_id = w.id
     and s.is_public = true;

  return jsonb_build_object(
    'wedding', jsonb_build_object(
      'partner_one_name',     w.partner_one_name,
      'partner_two_name',     w.partner_two_name,
      'wedding_date',         w.wedding_date,
      'venue_name',           w.venue_name,
      'city',                 w.city,
      'theme',                w.theme,
      'public_story',         w.public_story,
      'public_menu',          w.public_menu,
      'public_dress_code',    w.public_dress_code,
      'public_rsvp_deadline', w.public_rsvp_deadline,
      'public_hero_subtitle', w.public_hero_subtitle,
      'public_address',       w.public_address
    ),
    'schedule', schedule
  );
end;
$$;

-- ---------- Publieke RPC: RSVP-pagina per guest-token ----------
create or replace function public.public_get_rsvp(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  w record;
  schedule jsonb;
begin
  select *
    into g
    from public.guests
   where rsvp_token = p_token
   limit 1;

  if not found then
    return null;
  end if;

  select *
    into w
    from public.weddings
   where id = g.wedding_id
   limit 1;

  -- Avondgasten zien enkel dag-items die ook 's avonds zijn; dag-gasten zien alles publiek.
  select coalesce(jsonb_agg(to_jsonb(s) order by s.start_time, s.sort_order), '[]'::jsonb)
    into schedule
    from public.day_schedule_items s
   where s.wedding_id = w.id
     and s.is_public  = true
     and (g.invite_type = 'full_day' or s.is_evening_only = true);

  return jsonb_build_object(
    'guest', jsonb_build_object(
      'id',              g.id,
      'first_name',      g.first_name,
      'last_name',       g.last_name,
      'invite_type',     g.invite_type,
      'rsvp_status',     g.rsvp_status,
      'plus_one',        g.plus_one,
      'plus_one_name',   g.plus_one_name,
      'dietary_wishes',  g.dietary_wishes,
      'rsvp_submitted_at', g.rsvp_submitted_at
    ),
    'wedding', jsonb_build_object(
      'partner_one_name',     w.partner_one_name,
      'partner_two_name',     w.partner_two_name,
      'wedding_date',         w.wedding_date,
      'venue_name',           w.venue_name,
      'city',                 w.city,
      'theme',                w.theme,
      'public_story',         w.public_story,
      'public_menu',          w.public_menu,
      'public_dress_code',    w.public_dress_code,
      'public_rsvp_deadline', w.public_rsvp_deadline,
      'public_hero_subtitle', w.public_hero_subtitle,
      'public_address',       w.public_address,
      'public_slug',          w.public_slug,
      'public_enabled',       w.public_enabled
    ),
    'schedule', schedule
  );
end;
$$;

-- ---------- Publieke RPC: RSVP-inzending ----------
create or replace function public.public_submit_rsvp(
  p_token          text,
  p_status         text,
  p_plus_one       boolean,
  p_plus_one_name  text,
  p_dietary_wishes text,
  p_notes          text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g_id uuid;
  inv  text;
begin
  if p_status not in ('bevestigd','afgemeld') then
    raise exception 'ongeldige status';
  end if;

  select id, invite_type
    into g_id, inv
    from public.guests
   where rsvp_token = p_token
   limit 1;

  if g_id is null then
    raise exception 'ongeldige token';
  end if;

  update public.guests
     set rsvp_status      = p_status::public.rsvp_status,
         plus_one         = coalesce(p_plus_one, plus_one),
         plus_one_name    = nullif(trim(coalesce(p_plus_one_name, '')), ''),
         dietary_wishes   = nullif(trim(coalesce(p_dietary_wishes, '')), ''),
         notes            = nullif(trim(coalesce(p_notes, '')), ''),
         rsvp_submitted_at = now(),
         updated_at       = now()
   where id = g_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- Grants ----------
-- RPC's mogen door anon worden aangeroepen; tabel-RLS zelf blijft streng.
grant execute on function public.public_get_wedding_by_slug(text) to anon, authenticated;
grant execute on function public.public_get_rsvp(text)            to anon, authenticated;
grant execute on function public.public_submit_rsvp(text, text, boolean, text, text, text)
                                                                   to anon, authenticated;
