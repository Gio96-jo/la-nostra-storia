"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Link2, Mail, MailPlus, MoreVertical, Moon, Pencil, Phone, Sun, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { RSVP_STATUSES, getRsvpMeta, getRelationMeta } from "@/lib/constants";
import type { Guest, RsvpStatus } from "@/lib/types";

interface Props {
  guests: Guest[];
  onEdit: (g: Guest) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: RsvpStatus) => void;
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
}

function formatDateNL(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function GuestsTable({
  guests, onEdit, onDelete, onStatusChange, partnerOne, partnerTwo, weddingDate,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function rsvpUrl(g: Guest) {
    if (!g.rsvp_token) return null;
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    return `${base}/rsvp/${g.rsvp_token}`;
  }

  function emailRsvp(g: Guest) {
    const url = rsvpUrl(g);
    if (!url) {
      toast.error("Deze gast heeft nog geen RSVP-token.");
      return;
    }
    if (!g.email) {
      toast.error("Geen e-mailadres bekend voor deze gast.");
      return;
    }
    const subject = `Uitnodiging bruiloft ${partnerOne} & ${partnerTwo}`;
    const body =
      `Hey ${g.first_name},\n\n` +
      `We trouwen op ${formatDateNL(weddingDate)} en zouden het super vinden als je erbij bent!\n\n` +
      `Laat ons via jouw persoonlijke RSVP-link weten of je komt:\n${url}\n\n` +
      `Tot snel,\n${partnerOne} & ${partnerTwo}`;
    const mailto = `mailto:${encodeURIComponent(g.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  async function copyRsvpLink(g: Guest) {
    if (!g.rsvp_token) {
      toast.error("Deze gast heeft nog geen RSVP-token.");
      return;
    }
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    const url = `${base}/rsvp/${g.rsvp_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(g.id);
      window.setTimeout(() => setCopiedId(null), 1500);
      toast.success("RSVP-link gekopieerd");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Naam</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Contact</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">Relatie</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">Tafel</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => {
            const rsvp = getRsvpMeta(g.rsvp_status);
            const rel = getRelationMeta(g.relation);
            return (
              <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{g.first_name} {g.last_name}</p>
                  {g.dietary_wishes ? (
                    <p className="text-xs text-muted-foreground">🥗 {g.dietary_wishes}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.plus_one ? (
                      <Badge variant="outline" className="text-[10px]">
                        +1{g.plus_one_name ? ` · ${g.plus_one_name}` : ""}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${
                        g.invite_type === "evening_only"
                          ? "border-indigo-300 text-indigo-700"
                          : "border-sage-300 text-sage-800"
                      }`}
                    >
                      {g.invite_type === "evening_only" ? (
                        <>
                          <Moon className="h-2.5 w-2.5" /> Avond
                        </>
                      ) : (
                        <>
                          <Sun className="h-2.5 w-2.5" /> Hele dag
                        </>
                      )}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground space-y-0.5">
                  {g.email ? <p className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</p> : null}
                  {g.phone ? <p className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</p> : null}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">{rel.label}</td>
                <td className="px-4 py-3 hidden lg:table-cell">{g.table_group ?? "—"}</td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button>
                        <Badge className={rsvp.color}>{rsvp.label}</Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Wijzig RSVP</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {RSVP_STATUSES.map((s) => (
                        <DropdownMenuItem key={s.value} onClick={() => onStatusChange(g.id, s.value)}>
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(g)}>
                        <Pencil className="h-4 w-4" /> Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyRsvpLink(g)} disabled={!g.rsvp_token}>
                        {copiedId === g.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        {copiedId === g.id ? "Gekopieerd" : "Kopieer RSVP-link"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => emailRsvp(g)}
                        disabled={!g.rsvp_token || !g.email}
                      >
                        <MailPlus className="h-4 w-4" /> Verstuur RSVP via mail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(g.id)}>
                        <Trash2 className="h-4 w-4" /> Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
