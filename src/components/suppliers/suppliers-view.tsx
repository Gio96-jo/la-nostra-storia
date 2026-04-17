"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, ExternalLink, Mail, MoreVertical, Pencil, Phone, Plus, Search, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SUPPLIER_STATUSES, getCategoryMeta, getSupplierStatusMeta } from "@/lib/constants";
import type { Supplier, SupplierStatus, TaskCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { SupplierDialog } from "./supplier-dialog";

interface Props { weddingId: string; initial: Supplier[]; }

export function SuppliersView({ weddingId, initial }: Props) {
  const [items, setItems] = useState<Supplier[]>(initial);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | TaskCategory>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | SupplierStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => items.filter((s) => {
    if (filterCat !== "all" && s.category !== filterCat) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${s.name} ${s.contact_person ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, search, filterCat, filterStatus]);

  function upsert(s: Supplier) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === s.id);
      if (i === -1) return [s, ...prev];
      const copy = prev.slice();
      copy[i] = s;
      return copy;
    });
  }

  async function deleteSupplier(id: string) {
    const prev = items;
    setItems((p) => p.filter((s) => s.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Leverancier verwijderd");
    }
  }

  async function quickStatus(id: string, status: SupplierStatus) {
    setItems((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
    const supabase = createClient();
    await supabase.from("suppliers").update({ status }).eq("id", id);
  }

  return (
    <div>
      <PageHeader
        title="Leveranciers"
        description="Locaties, fotograaf, DJ, bloemist — alle contacten op één plek."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Nieuwe leverancier
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Zoek..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            {SUPPLIER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nog geen leveranciers"
          description="Voeg jullie eerste leverancier toe — een locatie, fotograaf, DJ of catering."
          action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Eerste leverancier</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const cat = getCategoryMeta(s.category);
            const stat = getSupplierStatusMeta(s.status);
            return (
              <Card key={s.id} className="card-hover">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-semibold truncate">{s.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge className={cat.color}>{cat.label}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button><Badge className={stat.color}>{stat.label}</Badge></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Wijzig status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SUPPLIER_STATUSES.map((st) => (
                              <DropdownMenuItem key={st.value} onClick={() => quickStatus(s.id, st.value)}>
                                {st.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(s); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" /> Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteSupplier(s.id)}>
                          <Trash2 className="h-4 w-4" /> Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {s.contact_person ? (
                      <p className="inline-flex items-center gap-2"><User className="h-3.5 w-3.5" /> {s.contact_person}</p>
                    ) : null}
                    {s.email ? (
                      <p className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" />
                        <a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a>
                      </p>
                    ) : null}
                    {s.phone ? (
                      <p className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                      </p>
                    ) : null}
                    {s.website ? (
                      <p className="inline-flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" />
                        <a href={s.website} target="_blank" rel="noreferrer" className="hover:underline truncate">{s.website.replace(/^https?:\/\//, "")}</a>
                      </p>
                    ) : null}
                  </div>
                  {s.agreed_price != null ? (
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Afgesproken</span>
                      <span className="font-serif text-lg font-semibold">{formatCurrency(Number(s.agreed_price))}</span>
                    </div>
                  ) : null}
                  {s.notes ? (
                    <p className="pt-2 border-t text-xs text-muted-foreground line-clamp-3">{s.notes}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weddingId={weddingId}
        editing={editing}
        onSaved={upsert}
      />
    </div>
  );
}
