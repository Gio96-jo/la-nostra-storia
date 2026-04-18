"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_ALLOWED_MIMES, PHOTO_BUCKET, PHOTO_MAX_BYTES, getSignedUrl } from "@/lib/photos";

interface Props {
  weddingId: string;
  initialPath: string | null;
  partnerOne: string;
  partnerTwo: string;
}

function extFromFile(file: File): string {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && byName.length <= 5) return byName;
  return "jpg";
}

export function CouplePhotoCard({ weddingId, initialPath, partnerOne, partnerTwo }: Props) {
  const router = useRouter();
  const [path, setPath] = useState<string | null>(initialPath);
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedUrl(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error("Foto te groot (max 10 MB)");
      return;
    }
    if (!PHOTO_ALLOWED_MIMES.includes(file.type)) {
      toast.error("Gebruik JPG, PNG, WEBP of HEIC");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const newPath = `${weddingId}/couple/${Date.now()}.${extFromFile(file)}`;
    const { error: upErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(newPath, file, { upsert: false, contentType: file.type || undefined });
    if (upErr) {
      setUploading(false);
      toast.error("Upload mislukt", { description: upErr.message });
      return;
    }
    const prevPath = path;
    const { error: dbErr } = await supabase
      .from("weddings")
      .update({ couple_photo_path: newPath })
      .eq("id", weddingId);
    if (dbErr) {
      await supabase.storage.from(PHOTO_BUCKET).remove([newPath]);
      setUploading(false);
      toast.error("Opslaan mislukt", { description: dbErr.message });
      return;
    }
    if (prevPath) await supabase.storage.from(PHOTO_BUCKET).remove([prevPath]);
    setPath(newPath);
    setUploading(false);
    toast.success("Koppelfoto geüpdatet");
    router.refresh();
  }

  async function remove() {
    if (!path) return;
    setRemoving(true);
    const supabase = createClient();
    const toRemove = path;
    const { error } = await supabase
      .from("weddings")
      .update({ couple_photo_path: null })
      .eq("id", weddingId);
    if (error) {
      setRemoving(false);
      toast.error("Verwijderen mislukt", { description: error.message });
      return;
    }
    await supabase.storage.from(PHOTO_BUCKET).remove([toRemove]);
    setPath(null);
    setRemoving(false);
    toast.success("Foto verwijderd");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
            {url ? (
              <Image src={url} alt={`${partnerOne} & ${partnerTwo}`} fill unoptimized className="object-cover" sizes="96px" />
            ) : (
              <Camera className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg font-semibold">
              {partnerOne} &amp; {partnerTwo}
            </p>
            <p className="text-xs text-muted-foreground">
              {path
                ? "Jullie koppelfoto staat op het dashboard. Wil je een andere? Upload een nieuwe."
                : "Voeg een foto van jullie toe — dan wordt het dashboard direct een stukje persoonlijker."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {path ? "Nieuwe foto" : "Upload foto"}
              </Button>
              {path ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={remove}
                  disabled={removing}
                  className="text-destructive hover:text-destructive"
                >
                  {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Verwijder
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={PHOTO_ALLOWED_MIMES.join(",")}
              className="hidden"
              onChange={onPick}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
