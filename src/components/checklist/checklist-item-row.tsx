"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Trash2, StickyNote, Flame, Circle, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateNL } from "@/lib/utils";
import { getCategoryMeta, getChecklistStatusMeta } from "@/lib/constants";
import type { ChecklistItem, ChecklistStatus } from "@/lib/types";

interface Props {
  item: ChecklistItem;
  onStatusChange: (status: ChecklistStatus) => void;
  onUrgentToggle: (value: boolean) => void;
  onDueDateChange: (date: string | null) => void;
  onDelete: () => void;
  onNotesSave: (notes: string) => void;
}

const STATUS_ICON: Record<ChecklistStatus, typeof Circle> = {
  open: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
};

function nextStatus(s: ChecklistStatus): ChecklistStatus {
  if (s === "open") return "in_progress";
  if (s === "in_progress") return "done";
  return "open";
}

export function ChecklistItemRow({
  item, onStatusChange, onUrgentToggle, onDueDateChange, onDelete, onNotesSave,
}: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const cat = getCategoryMeta(item.category);
  const statusMeta = getChecklistStatusMeta(item.status);
  const StatusIcon = STATUS_ICON[item.status];
  const overdue =
    item.status !== "done" && item.due_date && new Date(item.due_date) < new Date(new Date().toDateString());

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        item.status === "done" && "bg-muted/40 opacity-70",
        item.is_urgent && item.status !== "done" && "border-destructive/60 bg-destructive/5"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          aria-label="Wijzig status"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(nextStatus(item.status));
          }}
          className={cn(
            "mt-0.5 shrink-0 rounded-full p-1 transition-colors",
            item.status === "done" ? "text-sage-700" : item.status === "in_progress" ? "text-amber-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <StatusIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn(
                "text-sm font-medium leading-snug flex items-center gap-1.5",
                item.status === "done" && "line-through"
              )}>
                {item.is_urgent && item.status !== "done" ? (
                  <Flame className="h-4 w-4 text-destructive shrink-0" fill="currentColor" />
                ) : null}
                {item.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
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

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Deadline</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => {
                  const next = dueDate || null;
                  if (next !== (item.due_date ?? null)) onDueDateChange(next);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Markeren als urgent</Label>
              <Button
                type="button"
                variant={item.is_urgent ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => onUrgentToggle(!item.is_urgent)}
              >
                <Flame className="h-4 w-4" fill={item.is_urgent ? "currentColor" : "none"} />
                {item.is_urgent ? "Urgent — klik om te verwijderen" : "Markeer als urgent"}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Notities</Label>
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
