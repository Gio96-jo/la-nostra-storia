import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RsvpView } from "@/components/public/rsvp-view";
import type { RsvpPayload } from "@/components/public/rsvp-view";

export const dynamic = "force-dynamic";

export default async function RsvpPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_get_rsvp" as never, {
    p_token: params.token,
  } as never);

  if (error || !data) {
    notFound();
  }

  return <RsvpView token={params.token} payload={data as unknown as RsvpPayload} />;
}

export const metadata = { title: "RSVP" };
