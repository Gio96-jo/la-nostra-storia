"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays,
  NotebookPen, Settings, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays, NotebookPen, Settings,
};

const NAV_BOTTOM = [
  { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
  { href: "/checklist", label: "Taken", icon: "ListChecks" },
  { href: "/budget", label: "Budget", icon: "Wallet" },
  { href: "/gasten", label: "Gasten", icon: "Users" },
  { href: "/leveranciers", label: "Meer", icon: "Building2" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur safe-bottom">
      <div className="grid grid-cols-5">
        {NAV_BOTTOM.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
