import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata = { title: "Nieuw wachtwoord instellen" };

export default function NewPasswordPage() {
  return (
    <AuthShell title="Nieuw wachtwoord" description="Kies een nieuw wachtwoord voor je account.">
      <NewPasswordForm />
    </AuthShell>
  );
}
