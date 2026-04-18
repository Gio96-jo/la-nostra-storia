"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays,
  CalendarClock, NotebookPen, Settings, MoreHorizontal, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, ListChecks, Wallet, Users, Building2, CalendarDays, CalendarClock, NotebookPen, Settings,
};

const MAIN_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
  { href: "/checklist", label: "Taken", icon: "ListChecks" },
  { href: "/budget", label: "Budget", icon: "Wallet" },
  { href: "/gasten", label: "Gasten", icon: "Users" },
];

const MORE_ITEMS = [
  { href: "/leveranciers", label: "Leveranciers", icon: "Building2" },
  { href: "/tijdlijn", label: "Tijdlijn", icon: "CalendarDays" },
  { href: "/dagplanning", label: "Dagplanning", icon: "CalendarClock" },
  { href: "/notities", label: "Notities", icon: "NotebookPen" },
  { href: "/instellingen", label: "Instellingen", icon: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const moreActive = MORE_ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur safe-bottom">
      <div className="grid grid-cols-5">
        {MAIN_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium outline-none",
              moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            Meer
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
            {MORE_ITEMS.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 w-full",
                      active && "text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
