"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, Trash2, X, ListChecks, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDateNL } from "@/lib/utils";
import {
  deletePhoto,
  getSignedUrls,
  uploadPhoto,
  PHOTO_ALLOWED_MIMES,
} from "@/lib/photos";
import type { Photo, PhotoSourceType } from "@/lib/types";

interface Props {
  weddingId: string;
  initial: Photo[];
  noteLabels: Record<string, string>;
  taskLabels: Record<string, string>;
}

type Filter = "all" | PhotoSourceType;

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTHS_NL[Number(m) - 1]} ${y}`;
}

export function PhotoboothView({ weddingId, initial, noteLabels, taskLabels }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<Photo | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const paths = photos.map((p) => p.storage_path);
    if (paths.length === 0) { setUrls({}); return; }
    getSignedUrls(paths).then((m) => { if (active) setUrls(m); });
    return () => { active = false; };
  }, [photos]);

  const filtered = useMemo(() => {
    if (filter === "all") return photos;
    return photos.filter((p) => p.source_type === filter);
  }, [photos, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    filtered.forEach((p) => {
      const key = monthKey(p.uploaded_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    // sort keys desc
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const counts = useMemo(() => ({
    all: photos.length,
    booth: photos.filter((p) => p.source_type === "booth").length,
    note: photos.filter((p) => p.source_type === "note").length,
    checklist: photos.filter((p) => p.source_type === "checklist").length,
  }), [photos]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        const p = await uploadPhoto({
          weddingId,
          sourceType: "booth",
          sourceId: null,
          file,
        });
        uploaded.push(p);
      } catch (err) {
        toast.error("Upload mislukt", {
          description: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    }
    if (uploaded.length > 0) {
      setPhotos((prev) => [...uploaded, ...prev]);
      toast.success(`${uploaded.length} foto${uploaded.length === 1 ? "" : "'s"} toegevoegd`);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleDelete(p: Photo) {
    if (!window.confirm("Deze foto verwijderen?")) return;
    setDeleting(p.id);
    try {
      await deletePhoto(p);
      setPhotos((prev) => prev.filter((x) => x.id !== p.id));
      if (preview?.id === p.id) setPreview(null);
      toast.success("Foto verwijderd");
    } catch (err) {
      toast.error("Verwijderen mislukt", {
        description: err instanceof Error ? err.message : "Onbekende fout",
      });
    }
    setDeleting(null);
  }

  function sourceLabel(p: Photo): { label: string; href: string | null; icon: typeof ListChecks | typeof NotebookPen | typeof Sparkles } {
    if (p.source_type === "checklist") {
      const title = p.source_id ? taskLabels[p.source_id] : null;
      return { label: title ? `Taak: ${title}` : "Checklist-taak", href: "/checklist", icon: ListChecks };
    }
    if (p.source_type === "note") {
      const title = p.source_id ? noteLabels[p.source_id] : null;
      return { label: title ? `Notitie: ${title}` : "Notitie", href: "/notities", icon: NotebookPen };
    }
    return { label: "Photobooth", href: null, icon: Sparkles };
  }

  return (
    <div>
      <PageHeader
        title="Photobooth"
        description="Alle foto's die jullie uploaden bij notities, taken en hier verzameld in één chronologische tijdlijn."
        actions={
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
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Foto&apos;s uploaden
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { value: "all", label: "Alles", count: counts.all, icon: Camera },
          { value: "booth", label: "Photobooth", count: counts.booth, icon: Sparkles },
          { value: "note", label: "Notities", count: counts.note, icon: NotebookPen },
          { value: "checklist", label: "Taken", count: counts.checklist, icon: ListChecks },
        ] as const).map((f) => {
          const Icon = f.icon;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent/30 text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
              <span className="opacity-60">{f.count}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Nog geen foto's"
          description="Upload jullie eerste foto's bij notities of checklist-taken — of start direct hier bovenaan."
          action={
            <Button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>
              <ImagePlus className="h-4 w-4" /> Eerste foto&apos;s
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([key, list]) => (
            <section key={key}>
              <div className="flex items-end justify-between mb-3 border-b pb-2">
                <h2 className="font-serif text-xl font-semibold capitalize">{monthLabel(key)}</h2>
                <Badge variant="outline">{list.length}</Badge>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {list.map((p) => {
                  const url = urls[p.storage_path];
                  const src = sourceLabel(p);
                  const SrcIcon = src.icon;
                  return (
                    <Card key={p.id} className="group relative overflow-hidden p-0">
                      <button
                        type="button"
                        onClick={() => setPreview(p)}
                        className="relative block w-full"
                        style={{ aspectRatio: "1 / 1" }}
                        aria-label="Open foto"
                      >
                        {url ? (
                          <Image
                            src={url}
                            alt={p.caption ?? ""}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover transition-transform group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </button>
                      <CardContent className="p-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          {src.href ? (
                            <Link
                              href={src.href}
                              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary truncate"
                            >
                              <SrcIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{src.label}</span>
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                              <SrcIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{src.label}</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            disabled={deleting === p.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            aria-label="Verwijder foto"
                          >
                            {deleting === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateNL(p.uploaded_at)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {preview && urls[preview.storage_path] && (
            <div>
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
              <div className="flex items-center justify-between gap-2 p-3 border-t bg-card">
                <div className="text-xs text-muted-foreground">
                  {formatDateNL(preview.uploaded_at)} · {sourceLabel(preview).label}
                </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
