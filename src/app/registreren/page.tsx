import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Account aanmaken" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Maak jullie account"
      description="Eén account per stel. Je kunt later beide partners toevoegen."
      footer={
        <>
          Al een account?{" "}
          <Link className="text-primary font-medium hover:underline" href="/login">
            Inloggen
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
