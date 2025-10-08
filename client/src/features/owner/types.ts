export interface Aircraft {
  id: string;
  tail_number: string;
  model: string;
  base_location: string | null;
  status: string | null;
  owner_id: string | null;
  make?: string | null;
  hobbs_time?: number | null;
  tach_time?: number | null;
}

export interface ServiceTask {
  id: string;
  aircraft_id: string;
  type: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  photos: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  aircraft_id: string;
  owner_id: string;
  period_start: string;
  period_end: string;
  total_cents: number;
  status: string;
  hosted_invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_cents: number;
  created_at: string;
}

export interface Membership {
  id: string;
  owner_id: string;
  tier: string;
  tier_id: string | null;
  active: boolean;
  start_date: string;
  end_date: string | null;
}
