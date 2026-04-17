"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import type { Wedding } from "@/lib/types";

export function SettingsView({ wedding, email }: { wedding: Wedding; email: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [s, setS] = useState({
    partner_one_name: wedding.partner_one_name,
    partner_two_name: wedding.partner_two_name,
    wedding_date: wedding.wedding_date,
    estimated_budget: wedding.estimated_budget?.toString() ?? "",
    estimated_guest_count: wedding.estimated_guest_count?.toString() ?? "",
    venue_name: wedding.venue_name ?? "",
    city: wedding.city ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("weddings")
      .update({
        partner_one_name: s.partner_one_name.trim(),
        partner_two_name: s.partner_two_name.trim(),
        wedding_date: s.wedding_date,
        estimated_budget: s.estimated_budget ? Number(s.estimated_budget) : null,
        estimated_guest_count: s.estimated_guest_count ? Number(s.estimated_guest_count) : null,
        venue_name: s.venue_name.trim() || null,
        city: s.city.trim() || null,
      })
      .eq("id", wedding.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
      return;
    }
    toast.success("Instellingen opgeslagen");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Instellingen" description="Beheer jullie account en bruiloftsgegevens." />

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bruiloft</CardTitle>
            <CardDescription>Pas de basisgegevens van jullie bruiloft aan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Partner 1</Label>
                <Input value={s.partner_one_name} onChange={(e) => setS({ ...s, partner_one_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Partner 2</Label>
                <Input value={s.partner_two_name} onChange={(e) => setS({ ...s, partner_two_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trouwdatum</Label>
              <Input type="date" value={s.wedding_date} onChange={(e) => setS({ ...s, wedding_date: e.target.value })} />
              <p className="text-xs text-muted-foreground">Deadlines van seed-taken worden niet automatisch opnieuw berekend.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (€)</Label>
                <Input type="number" min={0} step={500} value={s.estimated_budget} onChange={(e) => setS({ ...s, estimated_budget: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aantal gasten</Label>
                <Input type="number" min={0} value={s.estimated_guest_count} onChange={(e) => setS({ ...s, estimated_guest_count: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Naam locatie</Label>
                <Input value={s.venue_name} onChange={(e) => setS({ ...s, venue_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Stad</Label>
                <Input value={s.city} onChange={(e) => setS({ ...s, city: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Beheer je account en weergavevoorkeuren.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">E-mailadres</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Weergave</p>
                <p className="text-sm text-muted-foreground">Wissel tussen lichte en donkere modus</p>
              </div>
              <Button variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <><Sun className="h-4 w-4" /> Licht</> : <><Moon className="h-4 w-4" /> Donker</>}
              </Button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Uitloggen</p>
                <p className="text-sm text-muted-foreground">Beëindig je sessie</p>
              </div>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline">Uitloggen</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
