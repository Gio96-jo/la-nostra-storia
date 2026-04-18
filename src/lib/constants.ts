import type { TaskCategory, WeddingPhase, RsvpStatus, GuestRelation, SupplierStatus, ChecklistStatus } from "./types";

export const APP_NAME = "La Nostra Storia";
export const APP_TAGLINE = "Jullie complete trouwplanner";

export const PHASES: { value: WeddingPhase; label: string; short: string }[] = [
  { value: "twaalf_plus_maanden", label: "12+ maanden voor de bruiloft", short: "12+ mnd" },
  { value: "negen_tot_twaalf_maanden", label: "9 tot 12 maanden", short: "9-12 mnd" },
  { value: "zes_tot_negen_maanden", label: "6 tot 9 maanden", short: "6-9 mnd" },
  { value: "drie_tot_zes_maanden", label: "3 tot 6 maanden", short: "3-6 mnd" },
  { value: "een_tot_drie_maanden", label: "1 tot 3 maanden", short: "1-3 mnd" },
  { value: "een_maand_tot_een_week", label: "1 maand tot 1 week", short: "1 mnd – 1 wk" },
  { value: "laatste_week", label: "Laatste week", short: "Laatste wk" },
  { value: "op_de_dag_zelf", label: "Op de dag zelf", short: "De dag zelf" },
];

export const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: "locatie", label: "Locatie", color: "bg-blush-100 text-blush-800" },
  { value: "catering", label: "Catering", color: "bg-amber-100 text-amber-800" },
  { value: "fotografie", label: "Fotografie", color: "bg-violet-100 text-violet-800" },
  { value: "muziek", label: "Muziek", color: "bg-indigo-100 text-indigo-800" },
  { value: "bloemen", label: "Bloemen", color: "bg-rose-100 text-rose-800" },
  { value: "kleding", label: "Kleding", color: "bg-pink-100 text-pink-800" },
  { value: "uitnodigingen", label: "Uitnodigingen", color: "bg-sage-100 text-sage-800" },
  { value: "huwelijksreis", label: "Huwelijksreis", color: "bg-sky-100 text-sky-800" },
  { value: "administratie", label: "Administratie", color: "bg-stone-100 text-stone-800" },
  { value: "overig", label: "Overig", color: "bg-neutral-100 text-neutral-800" },
];

export const RSVP_STATUSES: { value: RsvpStatus; label: string; color: string }[] = [
  { value: "uitgenodigd", label: "Uitgenodigd", color: "bg-stone-100 text-stone-800" },
  { value: "in_afwachting", label: "In afwachting", color: "bg-amber-100 text-amber-800" },
  { value: "bevestigd", label: "Bevestigd", color: "bg-sage-200 text-sage-800" },
  { value: "afgemeld", label: "Afgemeld", color: "bg-rose-100 text-rose-800" },
];

export const GUEST_RELATIONS: { value: GuestRelation; label: string }[] = [
  { value: "familie_bruid", label: "Familie bruid" },
  { value: "familie_bruidegom", label: "Familie bruidegom" },
  { value: "vrienden", label: "Vrienden" },
  { value: "collegas", label: "Collega's" },
  { value: "overig", label: "Overig" },
];

export const CHECKLIST_STATUSES: { value: ChecklistStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "bg-stone-100 text-stone-800" },
  { value: "in_progress", label: "Bezig", color: "bg-amber-100 text-amber-800" },
  { value: "done", label: "Klaar", color: "bg-sage-200 text-sage-800" },
];

export function getChecklistStatusMeta(value: ChecklistStatus) {
  return CHECKLIST_STATUSES.find((s) => s.value === value) ?? CHECKLIST_STATUSES[0];
}

export const SUPPLIER_STATUSES: { value: SupplierStatus; label: string; color: string }[] = [
  { value: "contact_opgenomen", label: "Contact opgenomen", color: "bg-stone-100 text-stone-800" },
  { value: "offerte_ontvangen", label: "Offerte ontvangen", color: "bg-amber-100 text-amber-800" },
  { value: "geboekt", label: "Geboekt", color: "bg-sage-200 text-sage-800" },
  { value: "betaald", label: "Betaald", color: "bg-emerald-100 text-emerald-800" },
];

export function getCategoryMeta(value: TaskCategory) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function getPhaseMeta(value: WeddingPhase) {
  return PHASES.find((p) => p.value === value) ?? PHASES[0];
}
export function getRsvpMeta(value: RsvpStatus) {
  return RSVP_STATUSES.find((r) => r.value === value) ?? RSVP_STATUSES[0];
}
export function getRelationMeta(value: GuestRelation) {
  return GUEST_RELATIONS.find((r) => r.value === value) ?? GUEST_RELATIONS[GUEST_RELATIONS.length - 1];
}
export function getSupplierStatusMeta(value: SupplierStatus) {
  return SUPPLIER_STATUSES.find((s) => s.value === value) ?? SUPPLIER_STATUSES[0];
}

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/checklist", label: "Checklist", icon: "ListChecks" },
  { href: "/budget", label: "Budget", icon: "Wallet" },
  { href: "/gasten", label: "Gasten", icon: "Users" },
  { href: "/leveranciers", label: "Leveranciers", icon: "Building2" },
  { href: "/tijdlijn", label: "Tijdlijn", icon: "CalendarDays" },
  { href: "/dagplanning", label: "Dagplanning", icon: "CalendarClock" },
  { href: "/ideeen", label: "Ideeën", icon: "Lightbulb" },
  { href: "/photobooth", label: "Photobooth", icon: "Camera" },
  { href: "/notities", label: "Notities", icon: "NotebookPen" },
  { href: "/instellingen", label: "Instellingen", icon: "Settings" },
] as const;
