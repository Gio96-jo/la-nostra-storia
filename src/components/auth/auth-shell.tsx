import Link from "next/link";
import { Heart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="romantic-gradient min-h-screen flex flex-col">
      <header className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          <span className="font-serif text-xl font-semibold">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start sm:items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg animate-fade-in">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
