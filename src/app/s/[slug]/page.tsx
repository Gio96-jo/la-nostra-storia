import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicWeddingSite } from "@/components/public/public-wedding-site";
import type { PublicWeddingData } from "@/components/public/public-wedding-site";

export const dynamic = "force-dynamic";

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

  return <PublicWeddingSite data={data as unknown as PublicWeddingData} />;
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
