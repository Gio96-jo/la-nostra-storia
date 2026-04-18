// Agenda-helpers: genereert Google Calendar URL + .ics bestand
// Geen dependencies nodig — alles met plain TS.

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  // Als start alleen een YYYY-MM-DD is → all-day event
  start: Date | string;
  // Optionele einddatum/tijd. Bij all-day is dit exclusief (dus zelfde dag → volgende dag).
  end?: Date | string;
  // Override all-day detectie
  allDay?: boolean;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toUTCStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function toDateOnlyStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function parseInput(v: Date | string): { date: Date; dateOnly: boolean } {
  if (v instanceof Date) return { date: v, dateOnly: false };
  // "YYYY-MM-DD" = all-day
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return { date: new Date(y, m - 1, d), dateOnly: true };
  }
  return { date: new Date(v), dateOnly: false };
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function addHours(d: Date, n: number): Date {
  const out = new Date(d);
  out.setHours(out.getHours() + n);
  return out;
}

/** Google Calendar "create event" URL — opent overal (web/app). */
export function googleCalendarUrl(e: CalendarEvent): string {
  const s = parseInput(e.start);
  const eEnd = e.end ? parseInput(e.end) : null;
  const allDay = e.allDay ?? (s.dateOnly && (!eEnd || eEnd.dateOnly));

  let dates: string;
  if (allDay) {
    const end = eEnd ? eEnd.date : addDays(s.date, 1);
    dates = `${toDateOnlyStamp(s.date)}/${toDateOnlyStamp(end)}`;
  } else {
    const end = eEnd ? eEnd.date : addHours(s.date, 1);
    dates = `${toUTCStamp(s.date)}/${toUTCStamp(end)}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
  });
  if (e.description) params.set("details", e.description);
  if (e.location) params.set("location", e.location);
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Bouwt een .ics string voor één event (Apple, Outlook, etc.). */
export function buildICS(e: CalendarEvent): string {
  const s = parseInput(e.start);
  const eEnd = e.end ? parseInput(e.end) : null;
  const allDay = e.allDay ?? (s.dateOnly && (!eEnd || eEnd.dateOnly));
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@la-nostra-storia`;
  const dtstamp = toUTCStamp(new Date());

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//La Nostra Storia//NL", "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${dtstamp}`, `SUMMARY:${escapeICS(e.title)}`];

  if (allDay) {
    const end = eEnd ? eEnd.date : addDays(s.date, 1);
    lines.push(`DTSTART;VALUE=DATE:${toDateOnlyStamp(s.date)}`);
    lines.push(`DTEND;VALUE=DATE:${toDateOnlyStamp(end)}`);
  } else {
    const end = eEnd ? eEnd.date : addHours(s.date, 1);
    lines.push(`DTSTART:${toUTCStamp(s.date)}`);
    lines.push(`DTEND:${toUTCStamp(end)}`);
  }

  if (e.description) lines.push(`DESCRIPTION:${escapeICS(e.description)}`);
  if (e.location) lines.push(`LOCATION:${escapeICS(e.location)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Triggert een .ics-download in de browser. */
export function downloadICS(e: CalendarEvent, filename = "event.ics") {
  const ics = buildICS(e);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Slugify voor filenames. */
export function safeFilename(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "event";
}
