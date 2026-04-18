import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RsvpView } from "@/components/public/rsvp-view";
import type { RsvpPayload } from "@/components/public/rsvp-view";
import type { PublicPhoto } from "@/components/public/public-wedding-site";

export const dynamic = "force-dynamic";

const BUCKET = "wedding-photos";
const SIGNED_TTL = 60 * 60;

async function enrich(
  payload: RsvpPayload,
  supabase: ReturnType<typeof createClient>,
): Promise<RsvpPayload> {
  const paths: string[] = [];
  (payload.photos ?? []).forEach((p) => paths.push(p.storage_path));
  const couplePath = payload.wedding.couple_photo_path ?? null;
  if (couplePath) paths.push(couplePath);

  if (paths.length === 0) return { ...payload, photos: payload.photos ?? [], couplePhotoUrl: null };

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL);
  const map = new Map<string, string>();
  (signed ?? []).forEach((r) => {
    if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
  });

  const photos: PublicPhoto[] = (payload.photos ?? []).map((p) => ({
    ...p,
    url: map.get(p.storage_path) ?? null,
  }));
  const couplePhotoUrl = couplePath ? (map.get(couplePath) ?? null) : null;
  return { ...payload, photos, couplePhotoUrl };
}

export default async function RsvpPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_get_rsvp" as never, {
    p_token: params.token,
  } as never);

  if (error || !data) {
    notFound();
  }

  const enriched = await enrich(data as unknown as RsvpPayload, supabase);
  return <RsvpView token={params.token} payload={enriched} />;
}

export const metadata = { title: "RSVP" };
