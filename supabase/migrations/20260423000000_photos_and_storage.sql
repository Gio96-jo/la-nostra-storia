-- =====================================================================
-- Ronde 5 — Foto-uploads (Supabase Storage)
--
-- Voegt toe:
--   * photos tabel met polymorfe koppeling naar notes/checklist/booth
--   * wedding-photos storage bucket (privaat)
--   * RLS op photos + storage.objects via public.user_owns_wedding()
--
-- Paden in storage: "<wedding_id>/<source>/<uuid>.<ext>"
-- =====================================================================

-- ---------- photos tabel ----------
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  storage_path text not null unique,
  source_type  text not null check (source_type in ('note','checklist','booth')),
  source_id    uuid,
  caption      text,
  mime_type    text,
  size_bytes   bigint,
  width        int,
  height       int,
  uploaded_at  timestamptz not null default now()
);

create index if not exists photos_wedding_idx      on public.photos(wedding_id, uploaded_at desc);
create index if not exists photos_source_idx       on public.photos(source_type, source_id);

alter table public.photos enable row level security;

drop policy if exists "photos_select_own" on public.photos;
drop policy if exists "photos_insert_own" on public.photos;
drop policy if exists "photos_update_own" on public.photos;
drop policy if exists "photos_delete_own" on public.photos;

create policy "photos_select_own" on public.photos
  for select using (public.user_owns_wedding(wedding_id));

create policy "photos_insert_own" on public.photos
  for insert with check (public.user_owns_wedding(wedding_id));

create policy "photos_update_own" on public.photos
  for update using (public.user_owns_wedding(wedding_id))
  with check (public.user_owns_wedding(wedding_id));

create policy "photos_delete_own" on public.photos
  for delete using (public.user_owns_wedding(wedding_id));

-- ---------- storage bucket ----------
-- Maakt de bucket aan als 'private' (geen publieke leesrechten).
-- Toegang tot files via signed URLs (10 min) vanuit de client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-photos',
  'wedding-photos',
  false,
  10485760, -- 10 MB per foto
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/avif']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- storage.objects RLS ----------
-- Alleen toegang tot objects binnen bucket 'wedding-photos' waarvan het
-- eerste pad-segment een wedding_id is die deze user bezit.

drop policy if exists "wedding_photos_select" on storage.objects;
drop policy if exists "wedding_photos_insert" on storage.objects;
drop policy if exists "wedding_photos_update" on storage.objects;
drop policy if exists "wedding_photos_delete" on storage.objects;

create policy "wedding_photos_select" on storage.objects
  for select
  using (
    bucket_id = 'wedding-photos'
    and public.user_owns_wedding( (storage.foldername(name))[1]::uuid )
  );

create policy "wedding_photos_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'wedding-photos'
    and public.user_owns_wedding( (storage.foldername(name))[1]::uuid )
  );

create policy "wedding_photos_update" on storage.objects
  for update
  using (
    bucket_id = 'wedding-photos'
    and public.user_owns_wedding( (storage.foldername(name))[1]::uuid )
  )
  with check (
    bucket_id = 'wedding-photos'
    and public.user_owns_wedding( (storage.foldername(name))[1]::uuid )
  );

create policy "wedding_photos_delete" on storage.objects
  for delete
  using (
    bucket_id = 'wedding-photos'
    and public.user_owns_wedding( (storage.foldername(name))[1]::uuid )
  );
