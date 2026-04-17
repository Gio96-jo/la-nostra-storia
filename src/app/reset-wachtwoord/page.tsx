import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Wachtwoord vergeten" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Wachtwoord vergeten?"
      description="Geen probleem — vul je e-mailadres in en we sturen je een reset-link."
      footer={
        <>
          Toch weer ingelogd?{" "}
          <Link className="text-primary font-medium hover:underline" href="/login">
            Terug naar inloggen
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
