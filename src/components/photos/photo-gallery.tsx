"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { deletePhoto, getSignedUrls, uploadPhoto, PHOTO_ALLOWED_MIMES } from "@/lib/photos";
import type { Photo, PhotoSourceType } from "@/lib/types";

interface Props {
  weddingId: string;
  sourceType: PhotoSourceType;
  sourceId: string | null;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  /** Als true: vraag bevestiging alvorens delete */
  confirmDelete?: boolean;
  /** Kleiner formaat gebruiken voor inline in kaarten */
  compact?: boolean;
  /** Disable nieuwe uploads (read-only) */
  readOnly?: boolean;
}

export function PhotoGallery({
  weddingId,
  sourceType,
  sourceId,
  photos,
  onPhotosChange,
  confirmDelete = true,
  compact = false,
  readOnly = false,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<Photo | null>(null);

  useEffect(() => {
    let active = true;
    const paths = photos.map((p) => p.storage_path);
    if (paths.length === 0) {
      setUrls({});
      return;
    }
    getSignedUrls(paths).then((m) => { if (active) setUrls(m); });
    return () => { active = false; };
  }, [photos]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        const photo = await uploadPhoto({
          weddingId,
          sourceType,
          sourceId,
          file,
        });
        uploaded.push(photo);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        toast.error("Upload mislukt", { description: msg });
      }
    }
    if (uploaded.length > 0) {
      onPhotosChange([...photos, ...uploaded]);
      toast.success(`${uploaded.length} foto${uploaded.length === 1 ? "" : "'s"} toegevoegd`);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleDelete(photo: Photo) {
    if (confirmDelete && !window.confirm("Deze foto verwijderen?")) return;
    setDeleting(photo.id);
    try {
      await deletePhoto(photo);
      onPhotosChange(photos.filter((p) => p.id !== photo.id));
      toast.success("Foto verwijderd");
      if (preview?.id === photo.id) setPreview(null);
    } catch (err) {
      toast.error("Verwijderen mislukt", {
        description: err instanceof Error ? err.message : "Onbekende fout",
      });
    }
    setDeleting(null);
  }

  const tileSize = compact ? "h-16 w-16" : "h-24 w-24";

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => {
            const url = urls[p.storage_path];
            return (
              <div
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-md border bg-muted",
                  tileSize
                )}
              >
                {url ? (
                  <button
                    type="button"
                    onClick={() => setPreview(p)}
                    className="relative block h-full w-full"
                    aria-label={p.caption ?? "Open foto"}
                  >
                    <Image
                      src={url}
                      alt={p.caption ?? ""}
                      fill
                      sizes={compact ? "64px" : "96px"}
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  </button>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    disabled={deleting === p.id}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-100"
                    aria-label="Verwijder foto"
                  >
                    {deleting === p.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <>
          <input
            ref={fileInput}
            type="file"
            accept={PHOTO_ALLOWED_MIMES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="gap-1.5"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Foto{photos.length > 0 ? " toevoegen" : "'s toevoegen"}
          </Button>
        </>
      )}

      {/* Lightbox / preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {preview && urls[preview.storage_path] && (
            <div className="relative">
              <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
                <Image
                  src={urls[preview.storage_path]}
                  alt={preview.caption ?? ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain bg-black"
                  unoptimized
                />
              </div>
              {!readOnly && (
                <div className="flex items-center justify-between gap-2 p-3 border-t bg-card">
                  <p className="text-sm text-muted-foreground truncate">
                    {preview.caption ?? ""}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(preview)}
                    disabled={deleting === preview.id}
                  >
                    {deleting === preview.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Verwijderen
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
