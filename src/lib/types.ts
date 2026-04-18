export type WeddingPhase =
  | "twaalf_plus_maanden"
  | "negen_tot_twaalf_maanden"
  | "zes_tot_negen_maanden"
  | "drie_tot_zes_maanden"
  | "een_tot_drie_maanden"
  | "een_maand_tot_een_week"
  | "laatste_week"
  | "op_de_dag_zelf";

export type TaskCategory =
  | "locatie"
  | "catering"
  | "fotografie"
  | "muziek"
  | "bloemen"
  | "kleding"
  | "uitnodigingen"
  | "huwelijksreis"
  | "administratie"
  | "overig";

export type RsvpStatus = "uitgenodigd" | "bevestigd" | "afgemeld" | "in_afwachting";

export type GuestRelation =
  | "familie_bruid"
  | "familie_bruidegom"
  | "vrienden"
  | "collegas"
  | "overig";

export type SupplierStatus =
  | "contact_opgenomen"
  | "offerte_ontvangen"
  | "geboekt"
  | "betaald";

export type ChecklistStatus = "open" | "in_progress" | "done";

export interface Wedding {
  id: string;
  owner_id: string;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string;
  estimated_budget: number | null;
  estimated_guest_count: number | null;
  venue_name: string | null;
  city: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  phase: WeddingPhase;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  is_custom: boolean;
  status: ChecklistStatus;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  wedding_id: string;
  name: string;
  category: TaskCategory;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  agreed_price: number | null;
  status: SupplierStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  wedding_id: string;
  supplier_id: string | null;
  category: TaskCategory;
  description: string;
  estimated_cost: number;
  actual_cost: number | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  relation: GuestRelation;
  table_group: string | null;
  rsvp_status: RsvpStatus;
  dietary_wishes: string | null;
  plus_one: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  wedding_id: string;
  title: string;
  content: string | null;
  link_url: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DayScheduleItem {
  id: string;
  wedding_id: string;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string | null;
  title: string;
  description: string | null;
  location_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      weddings: { Row: Wedding; Insert: Partial<Wedding> & Pick<Wedding, "owner_id" | "partner_one_name" | "partner_two_name" | "wedding_date">; Update: Partial<Wedding> };
      checklist_items: { Row: ChecklistItem; Insert: Partial<ChecklistItem> & Pick<ChecklistItem, "wedding_id" | "title" | "phase">; Update: Partial<ChecklistItem> };
      suppliers: { Row: Supplier; Insert: Partial<Supplier> & Pick<Supplier, "wedding_id" | "name">; Update: Partial<Supplier> };
      budget_items: { Row: BudgetItem; Insert: Partial<BudgetItem> & Pick<BudgetItem, "wedding_id" | "description">; Update: Partial<BudgetItem> };
      guests: { Row: Guest; Insert: Partial<Guest> & Pick<Guest, "wedding_id" | "first_name">; Update: Partial<Guest> };
      notes: { Row: Note; Insert: Partial<Note> & Pick<Note, "wedding_id" | "title">; Update: Partial<Note> };
      day_schedule_items: {
        Row: DayScheduleItem;
        Insert: Partial<DayScheduleItem> & Pick<DayScheduleItem, "wedding_id" | "start_time" | "title">;
        Update: Partial<DayScheduleItem>;
      };
    };
  };
};
