"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Trash2, StickyNote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateNL } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/constants";
import type { ChecklistItem } from "@/lib/types";

interface Props {
  item: ChecklistItem;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
  onNotesSave: (notes: string) => void;
}

export function ChecklistItemRow({ item, onToggle, onDelete, onNotesSave }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const cat = getCategoryMeta(item.category);
  const overdue =
    !item.is_completed && item.due_date && new Date(item.due_date) < new Date(new Date().toDateString());

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        item.is_completed && "bg-muted/40 opacity-70"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={(v) => onToggle(!!v)}
          className="mt-0.5"
        />
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn("text-sm font-medium leading-snug", item.is_completed && "line-through")}>
                {item.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge className={cat.color}>{cat.label}</Badge>
                {item.due_date ? (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    overdue ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {formatDateNL(item.due_date)}
                    {overdue ? " (achterstallig)" : ""}
                  </span>
                ) : null}
                {item.notes ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <StickyNote className="h-3 w-3" /> notitie
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")}
            />
          </div>
        </button>
      </div>
      {open ? (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
          {item.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          ) : null}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notities</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onNotesSave(notes)}
              placeholder="Eigen aantekeningen voor deze taak..."
              className="mt-1"
            />
          </div>
          <div className="flex justify-end no-print">
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Verwijderen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
