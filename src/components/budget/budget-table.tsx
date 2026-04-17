"use client";

import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/constants";
import type { BudgetItem } from "@/lib/types";

interface Props {
  items: BudgetItem[];
  suppliers: { id: string; name: string }[];
  onEdit: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, value: boolean) => void;
}

export function BudgetTable({ items, suppliers, onEdit, onDelete, onTogglePaid }: Props) {
  const supName = (id: string | null) => suppliers.find((s) => s.id === id)?.name;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Betaald</th>
            <th className="px-4 py-3 font-medium">Omschrijving</th>
            <th className="px-4 py-3 font-medium">Categorie</th>
            <th className="px-4 py-3 font-medium text-right">Geschat</th>
            <th className="px-4 py-3 font-medium text-right">Werkelijk</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const cat = getCategoryMeta(item.category);
            return (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={item.is_paid}
                    onCheckedChange={(v) => onTogglePaid(item.id, !!v)}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.description}</p>
                  {item.supplier_id ? (
                    <p className="text-xs text-muted-foreground">via {supName(item.supplier_id) ?? "—"}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3"><Badge className={cat.color}>{cat.label}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(Number(item.estimated_cost ?? 0))}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {item.actual_cost != null ? formatCurrency(Number(item.actual_cost)) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" /> Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
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
