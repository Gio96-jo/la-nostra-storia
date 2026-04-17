"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays,
  NotebookPen, Settings, Heart, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays, NotebookPen, Settings,
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/checklist", label: "Checklist", icon: "ListChecks" },
  { href: "/budget", label: "Budget", icon: "Wallet" },
  { href: "/gasten", label: "Gasten", icon: "Users" },
  { href: "/leveranciers", label: "Leveranciers", icon: "Building2" },
  { href: "/tijdlijn", label: "Tijdlijn", icon: "CalendarDays" },
  { href: "/notities", label: "Notities", icon: "NotebookPen" },
  { href: "/instellingen", label: "Instellingen", icon: "Settings" },
];

export function Sidebar({ partnerNames }: { partnerNames: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Heart className="h-5 w-5 text-primary" fill="currentColor" />
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{partnerNames}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
