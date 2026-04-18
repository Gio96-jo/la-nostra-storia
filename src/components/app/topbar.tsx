"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Heart, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { GlobalSearch } from "./global-search";

export function Topbar({
  email, partnerNames, weddingId,
}: { email: string; partnerNames: string; weddingId: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="lg:hidden sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Heart className="h-5 w-5 text-primary shrink-0" fill="currentColor" />
          <div className="leading-tight min-w-0">
            <p className="font-serif text-sm font-semibold">{APP_NAME}</p>
            <p className="text-[11px] text-muted-foreground truncate">{partnerNames}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <GlobalSearch weddingId={weddingId} />
          <UserMenu email={email} theme={theme} setTheme={setTheme} mounted={mounted} />
        </div>
      </div>
    </header>
  );
}

export function DesktopUserMenu({ email, weddingId }: { email: string; weddingId: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="hidden lg:flex items-center justify-end gap-1 border-b bg-card/40 backdrop-blur px-6 py-3">
      <GlobalSearch weddingId={weddingId} />
      <UserMenu email={email} theme={theme} setTheme={setTheme} mounted={mounted} />
    </div>
  );
}

function UserMenu({
  email, theme, setTheme, mounted,
}: { email: string; theme?: string; setTheme: (t: string) => void; mounted: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mounted ? (
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Lichte modus" : "Donkere modus"}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post" className="contents">
          <button type="submit" className="w-full">
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Uitloggen
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
