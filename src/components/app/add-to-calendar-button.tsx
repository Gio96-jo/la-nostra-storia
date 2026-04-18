"use client";

import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type CalendarEvent,
  downloadICS,
  googleCalendarUrl,
  safeFilename,
} from "@/lib/calendar";

interface Props {
  event: CalendarEvent;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  filename?: string;
}

export function AddToCalendarButton({
  event, label = "Voeg toe aan agenda", variant = "outline", size = "sm",
  className, filename,
}: Props) {
  const gUrl = googleCalendarUrl(event);
  const name = filename ?? safeFilename(event.title);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} size={size} className={className}>
          <CalendarPlus className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={gUrl} target="_blank" rel="noopener noreferrer">
            <CalendarPlus className="h-4 w-4" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadICS(event, name)}>
          <Download className="h-4 w-4" />
          Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
