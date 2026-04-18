"use client";

import { createClient } from "@/lib/supabase/client";
import type { Photo, PhotoSourceType } from "@/lib/types";

export const PHOTO_BUCKET = "wedding-photos";
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const PHOTO_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
];
const SIGNED_URL_SECONDS = 60 * 60; // 1h

function extFromFile(file: File): string {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && byName.length <= 5) return byName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/avif": "avif",
  };
  return map[file.type] ?? "jpg";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Upload een foto naar storage en registreer in de photos tabel.
 * Pad: "<wedding_id>/<source_type>/<uuid>.<ext>"
 */
export async function uploadPhoto(params: {
  weddingId: string;
  sourceType: PhotoSourceType;
  sourceId?: string | null;
  file: File;
  caption?: string | null;
}): Promise<Photo> {
  const { weddingId, sourceType, sourceId = null, file, caption = null } = params;

  if (file.size > PHOTO_MAX_BYTES) {
    throw new Error(`Foto is te groot (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`);
  }
  if (!PHOTO_ALLOWED_MIMES.includes(file.type)) {
    throw new Error(`Type ${file.type || "onbekend"} niet ondersteund. Gebruik JPG, PNG, WEBP of HEIC.`);
  }

  const supabase = createClient();
  const ext = extFromFile(file);
  const path = `${weddingId}/${sourceType}/${randomId()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) throw new Error(`Upload mislukt: ${upErr.message}`);

  const insert = {
    wedding_id: weddingId,
    storage_path: path,
    source_type: sourceType,
    source_id: sourceId,
    caption,
    mime_type: file.type || null,
    size_bytes: file.size,
  };

  const { data, error } = await supabase
    .from("photos")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    // Best-effort cleanup
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw new Error(`Opslaan in DB mislukt: ${error?.message ?? "onbekende fout"}`);
  }

  return data as Photo;
}

export async function deletePhoto(photo: Photo): Promise<void> {
  const supabase = createClient();
  const { error: delObjErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (delObjErr) throw new Error(`Bestand verwijderen mislukt: ${delObjErr.message}`);

  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw new Error(`DB-record verwijderen mislukt: ${error.message}`);
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error || !data) return {};
  const out: Record<string, string> = {};
  data.forEach((r) => {
    if (r.path && r.signedUrl) out[r.path] = r.signedUrl;
  });
  return out;
}
