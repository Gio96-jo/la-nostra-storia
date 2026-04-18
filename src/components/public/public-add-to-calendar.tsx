"use client";

import { AddToCalendarButton } from "@/components/app/add-to-calendar-button";
import type { CalendarEvent } from "@/lib/calendar";

export function PublicAddToCalendar(props: {
  event: CalendarEvent;
  label?: string;
  filename?: string;
  size?: "sm" | "default";
}) {
  return <AddToCalendarButton {...props} variant="outline" />;
}
