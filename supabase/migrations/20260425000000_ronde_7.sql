-- =====================================================================
-- Ronde 7 — Dashboard-koppelfoto + publieke photobooth-foto's
--
-- Voegt toe:
--   * weddings.couple_photo_path — pad naar een geüploade foto van het stel
--     (wordt getoond bovenaan het dashboard)
--   * photos.is_public — vlag zodat specifieke photobooth-foto's op de
--     publieke site en RSVP-link zichtbaar kunnen zijn
--   * public_get_wedding_by_slug() en public_get_rsvp() geven nu ook de
--     lijst publieke foto's terug (met storage-paden)
--   * storage.objects policy voor anon-read op publieke foto's, en op het
--     couple_photo_path van publiek ingeschakelde bruiloften
-- =====================================================================

alter table public.weddings
  add column if not exists couple_photo_path text;

alter table public.photos
  add column if not exists is_public boolean not null default false;

create index if not exists photos_public_idx
  on public.photos(wedding_id, is_public)
  where is_public = true;

-- ---------- RPC updates ----------
create or replace function public.public_get_wedding_by_slug(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
  schedule jsonb;
  photos jsonb;
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

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',           p.id,
             'storage_path', p.storage_path,
             'caption',      p.caption
           )
           order by p.uploaded_at desc
         ), '[]'::jsonb)
    into photos
    from public.photos p
   where p.wedding_id = w.id
     and p.is_public  = true
     and p.source_type = 'booth';

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
      'public_address',       w.public_address,
      'couple_photo_path',    w.couple_photo_path
    ),
    'schedule', schedule,
    'photos',   photos
  );
end;
$$;

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
  photos jsonb;
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

  select coalesce(jsonb_agg(to_jsonb(s) order by s.start_time, s.sort_order), '[]'::jsonb)
    into schedule
    from public.day_schedule_items s
   where s.wedding_id = w.id
     and s.is_public  = true
     and (g.invite_type = 'full_day' or s.is_evening_only = true);

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',           p.id,
             'storage_path', p.storage_path,
             'caption',      p.caption
           )
           order by p.uploaded_at desc
         ), '[]'::jsonb)
    into photos
    from public.photos p
   where p.wedding_id = w.id
     and p.is_public  = true
     and p.source_type = 'booth';

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
      'public_enabled',       w.public_enabled,
      'couple_photo_path',    w.couple_photo_path
    ),
    'schedule', schedule,
    'photos',   photos
  );
end;
$$;

-- ---------- Storage: lees-toegang voor anon op publieke foto's ----------
-- Laat anon de binary ophalen uit 'wedding-photos' voor:
--   * photo rows met is_public = true, ongeacht of de site publiek staat
--     (toegang wordt in de UI enkel via RSVP-token of publieke slug getoond,
--      dus het lekt alleen paden die de eigenaar expliciet publiek zette)
--   * couple_photo_path van een wedding met public_enabled = true
--
-- De eigen (ingelogde) eigenaar heeft al volledige toegang via de bestaande
-- "wedding_photos_select" policy — we voegen gewoon een extra policy toe.

drop policy if exists "wedding_photos_public_select" on storage.objects;
create policy "wedding_photos_public_select" on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'wedding-photos'
    and (
      exists (
        select 1 from public.photos p
         where p.storage_path = name
           and p.is_public = true
      )
      or exists (
        select 1 from public.weddings w
         where w.couple_photo_path = name
           and w.public_enabled = true
      )
    )
  );
