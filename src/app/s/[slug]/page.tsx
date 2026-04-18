import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicWeddingSite } from "@/components/public/public-wedding-site";
import type { PublicWeddingData, PublicPhoto } from "@/components/public/public-wedding-site";

export const dynamic = "force-dynamic";

const BUCKET = "wedding-photos";
const SIGNED_TTL = 60 * 60;

async function enrichWithSignedUrls(
  data: PublicWeddingData,
  supabase: ReturnType<typeof createClient>,
): Promise<PublicWeddingData> {
  const paths: string[] = [];
  (data.photos ?? []).forEach((p) => paths.push(p.storage_path));
  const couplePath = data.wedding.couple_photo_path ?? null;
  if (couplePath) paths.push(couplePath);

  if (paths.length === 0) return { ...data, photos: data.photos ?? [], couplePhotoUrl: null };

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL);
  const map = new Map<string, string>();
  (signed ?? []).forEach((r) => {
    if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
  });

  const photos: PublicPhoto[] = (data.photos ?? []).map((p) => ({
    ...p,
    url: map.get(p.storage_path) ?? null,
  }));
  const couplePhotoUrl = couplePath ? (map.get(couplePath) ?? null) : null;

  return { ...data, photos, couplePhotoUrl };
}

export default async function PublicWeddingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_get_wedding_by_slug" as never, {
    p_slug: params.slug,
  } as never);

  if (error || !data) {
    notFound();
  }

  const enriched = await enrichWithSignedUrls(data as unknown as PublicWeddingData, supabase);
  return <PublicWeddingSite data={enriched} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("public_get_wedding_by_slug" as never, {
    p_slug: params.slug,
  } as never);
  const d = data as unknown as PublicWeddingData | null;
  if (!d) return { title: "Bruiloft" };
  const { partner_one_name, partner_two_name, wedding_date } = d.wedding;
  return {
    title: `${partner_one_name} & ${partner_two_name} — Bruiloft`,
    description: `De trouwdag van ${partner_one_name} & ${partner_two_name} op ${wedding_date}.`,
  };
}
