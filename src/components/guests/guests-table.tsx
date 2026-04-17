"use client";

import { Mail, MoreVertical, Pencil, Phone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { GUEST_RELATIONS, RSVP_STATUSES, getRsvpMeta, getRelationMeta } from "@/lib/constants";
import type { Guest, RsvpStatus } from "@/lib/types";

interface Props {
  guests: Guest[];
  onEdit: (g: Guest) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: RsvpStatus) => void;
}

export function GuestsTable({ guests, onEdit, onDelete, onStatusChange }: Props) {
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
                  {g.plus_one ? (
                    <Badge variant="outline" className="mt-1 text-[10px]">+1</Badge>
                  ) : null}
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
