import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Inloggen" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell
      title="Welkom terug"
      description="Log in om verder te gaan met jullie planning."
      footer={
        <>
          Nog geen account?{" "}
          <Link className="text-primary font-medium hover:underline" href="/registreren">
            Maak er een aan
          </Link>
        </>
      }
    >
      <LoginForm next={searchParams.next} />
    </AuthShell>
  );
}
