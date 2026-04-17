"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nieuwe-wachtwoord`,
    });
    setLoading(false);
    if (error) {
      toast.error("Versturen mislukt", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Reset-link verstuurd");
  }

  if (sent) {
    return (
      <div className="rounded-md bg-sage-100 border border-sage-200 p-4 text-sm text-sage-900">
        Check je inbox! We hebben een e-mail verstuurd naar <strong>{email}</strong> met een link om je wachtwoord te resetten.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verstuur reset-link"}
      </Button>
    </form>
  );
}
