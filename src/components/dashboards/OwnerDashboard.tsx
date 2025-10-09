import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import {OwnerKpis} from "@/features/owner-kpis";

// Owner Dashboard

export default function OwnerDashboard() {
  const { user } = useAuth(); 
  const { data: aircraft } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data } = await supabase
        .from("aircraft")
        .select("id, tail_number, model, owner_id, base_location, status, hobbs_time, tach_time, created_at, updated_at")
        .eq("owner_id", user?.id)
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const { data: nextFlight, refetch: refetchNextFlight } = useQuery({
    queryKey: ["next-flight", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data } = await supabase
        .from("service_requests")
        .select("id, aircraft_id, user_id, service_id, service_type, description, priority, airport, requested_departure, status, credits_used, is_extra_charge, created_at, updated_at")
        .eq("user_id", user?.id)
        .eq("service_type", "Pre-Flight Concierge")
        .not("requested_departure", "is", null)
        .gte("requested_departure", new Date().toISOString())
        .order("requested_departure", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const { data: serviceRequests = [], refetch: refetchServiceRequests } = useQuery({
    queryKey: ["service-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, aircraft_id, user_id, service_id, service_type, description, priority, airport, requested_departure, status, credits_used, is_extra_charge, created_at, updated_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Error fetching service requests:", error);
        return [];
      }
      
      return data || [];
    }
  });


  // Fetch service tasks for timeline
  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["service-tasks", aircraft?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id) return [];
      
      const { data, error } = await supabase
        .from("service_tasks")
        .select("id, aircraft_id, type, status, assigned_to, notes, photos, completed_at, created_at, updated_at")
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching service tasks:", error);
        return [];
      }
      
      // Transform the data to match ServiceTask type
      return data.map((task) => ({
        id: task.id,
        aircraft_id: task.aircraft_id,
        type: task.type,
        status: task.status,
        assigned_to: task.assigned_to,
        notes: task.notes,
        photos: Array.isArray(task.photos) ? task.photos.filter((p): p is string => typeof p === 'string') : [],
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));
    },
  });

  // Fetch invoices for billing
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", aircraft?.id, user?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("id, aircraft_id, owner_id, period_start, period_end, status, total_cents, hosted_invoice_url, created_at, updated_at")
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }
      
      return data;
    },
  });

  // Fetch membership
  const { data: membership = null } = useQuery({
    queryKey: ["membership", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("memberships")
        .select("id, owner_id, tier, tier_id, active, start_date, end_date, created_at, updated_at")
        .eq("owner_id", user.id)
        .eq("active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching membership:", error);
        return null;
      }
      
      return data;
    },
  });

  // Real-time subscription for service requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetchNextFlight();
          refetchServiceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetchServiceRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchNextFlight, refetchServiceRequests]);

  // Calculate readiness status
  const readinessTypes = [
    "readiness",
    "clean",
    "detail",
    "oil",
    "o2",
    "tks",
    "db_update",
  ];
  
  const hasOpenTask = serviceTasks.some(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      readinessTypes.some((type) => task.type.toLowerCase().includes(type))
  );

  const readinessStatus = hasOpenTask ? "Needs Service" : "Ready";
  const readinessVariant = hasOpenTask ? "destructive" : "default";

  const formatHours = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numericValue)) {
      return "N/A";
    }

    return `${numericValue.toFixed(1)} hrs`;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
            <Plane className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aircraft ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                    <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                    <p className="text-xs text-muted-foreground">Base: {aircraft.base_location}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Hobbs Time</p>
                    <p className="text-xl font-semibold">{formatHours(aircraft.hobbs_time)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tach Time</p>
                    <p className="text-xl font-semibold">{formatHours(aircraft.tach_time)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {membership && (
                    <Badge variant="secondary">
                      {membership.tier}
                    </Badge>
                  )}
                  <Badge variant={readinessVariant as any}>
                    {readinessStatus}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No aircraft assigned</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aircraft && user && (
            <QuickActions 
              aircraftId={aircraft.id} 
              userId={user.id}
              aircraftData={aircraft}
            />
          )}
          <BillingCard invoices={invoices} isLoading={invoicesLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceTimeline 
            tasks={serviceTasks} 
            requests={serviceRequests}
            isLoading={tasksLoading} 
          />
          <DocsCard />
        </div>
          <div className="grid gap-4 md:grid-cols-4">
  <OwnerKpis />
</div>
        <CreditsOverview />
      </div>
    </Layout>
  );
}
// ============================================================
// OWNER DASHBOARD – APPEND-ONLY FEATURE PACK (helpers + renders)
// Safe to paste at the end of OwnerDashboard.tsx
// ============================================================

// ---------- Types ----------
type OD_UUID = string;

export type OD_Reservation = {
  id: OD_UUID;
  owner_id: OD_UUID;
  aircraft_id: OD_UUID;
  start_at: string;
  end_at: string;
  destination?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OD_MaintDue = {
  id: OD_UUID;
  aircraft_id: OD_UUID;
  item: string;
  due_at_hours?: number | null;
  due_at_date?: string | null;
  remaining_hours?: number | null;
  remaining_days?: number | null;
  severity?: "low" | "normal" | "high" | string | null;
};

export type OD_Consumables = {
  aircraft_id: OD_UUID;
  oil_qts?: number | null;
  o2_pct?: number | null;
  tks_pct?: number | null;
  last_updated?: string | null;
};

export type OD_PilotCurrency = {
  owner_id: OD_UUID;
  fr_due?: string | null;
  ipc_due?: string | null;
  medical_due?: string | null;
  ifr_6in6_status?: string | null;
  night_to_landing_due?: string | null;
};

export type OD_Notification = {
  id: OD_UUID;
  user_id: OD_UUID;
  title?: string | null;
  body?: string | null;
  level?: "info" | "warning" | "critical" | string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export type OD_Insurance = {
  aircraft_id: OD_UUID;
  carrier?: string | null;
  policy_number?: string | null;
  limits?: string | null;
  expires_on?: string | null;
  status?: string | null;
};

export type OD_PaymentMethod = {
  id: OD_UUID;
  owner_id: OD_UUID;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  is_default?: boolean | null;
};

export type OD_Ticket = {
  id: OD_UUID;
  owner_id: OD_UUID;
  subject: string;
  body?: string | null;
  status?: "open" | "pending" | "closed" | string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

// ---------- Formatters ----------
export function od_fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
export function od_fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
export function od_fmtMoneyUSD(v?: number | null) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(v));
  } catch {
    return `$${Number(v).toFixed(2)}`;
  }
}
export function od_fmtHours(v?: number | string | null) {
  if (v === null || v === undefined) return "N/A";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return "N/A";
  return `${n.toFixed(1)} hrs`;
}

// ---------- API helpers (Supabase) ----------
export async function od_getReservations(ownerId: string, aircraftId: string, limit = 5): Promise<OD_Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("aircraft_id", aircraftId)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function od_createReservation(p: {
  ownerId: string; aircraftId: string; startAt: string; endAt: string; destination?: string;
}): Promise<OD_Reservation> {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      owner_id: p.ownerId, aircraft_id: p.aircraftId,
      start_at: p.startAt, end_at: p.endAt, destination: p.destination ?? null, status: "requested",
    })
    .select("*").maybeSingle();
  if (error) throw error;
  return data as OD_Reservation;
}

export async function od_cancelReservation(reservationId: string): Promise<void> {
  const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservationId);
  if (error) throw error;
}

export async function od_getMaintenanceDue(aircraftId: string, limit = 8): Promise<OD_MaintDue[]> {
  const { data, error } = await supabase
    .from("maintenance_due")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .order("severity", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function od_getConsumables(aircraftId: string): Promise<OD_Consumables | null> {
  const { data, error } = await supabase
    .from("aircraft_consumables")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function od_requestTopOff(ownerId: string, aircraftId: string, type: "oil" | "o2" | "tks"): Promise<void> {
  const { error } = await supabase.from("service_requests").insert({
    user_id: ownerId, aircraft_id: aircraftId, service_type: `Top-Off: ${type.toUpperCase()}`, status: "pending",
  });
  if (error) throw error;
}

export async function od_getPilotCurrency(ownerId: string): Promise<OD_PilotCurrency | null> {
  const { data, error } = await supabase
    .from("pilot_currency")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function od_getUnreadNotifications(userId: string, limit = 10): Promise<OD_Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function od_markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function od_getInsurance(aircraftId: string): Promise<OD_Insurance | null> {
  const { data, error } = await supabase
    .from("insurance_policies")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function od_getPaymentMethods(ownerId: string): Promise<OD_PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function od_setDefaultPaymentMethod(ownerId: string, paymentMethodId: string): Promise<void> {
  const { error: e1 } = await supabase.from("payment_methods").update({ is_default: false }).eq("owner_id", ownerId);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", paymentMethodId)
    .eq("owner_id", ownerId);
  if (e2) throw e2;
}

export async function od_removePaymentMethod(ownerId: string, paymentMethodId: string): Promise<void> {
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", paymentMethodId)
    .eq("owner_id", ownerId);
  if (error) throw error;
}

export async function od_createSupportTicket(ownerId: string, subject: string, body?: string): Promise<OD_Ticket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ owner_id: ownerId, subject, body: body ?? null, status: "open" })
    .select("*").maybeSingle();
  if (error) throw error;
  return data as OD_Ticket;
}

export async function od_listSupportTickets(ownerId: string, limit = 5): Promise<OD_Ticket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function od_createSquawk(p: { ownerId: string; aircraftId: string; item: string; notes?: string; }): Promise<void> {
  const { error } = await supabase.from("service_requests").insert({
    user_id: p.ownerId, aircraft_id: p.aircraftId, service_type: "Squawk", status: "pending",
    notes: p.notes ? `${p.item} — ${p.notes}` : p.item,
  });
  if (error) throw error;
}

export async function od_createDocPlaceholder(p: { ownerId: string; aircraftId?: string; label: string; }): Promise<void> {
  const { error } = await supabase.from("documents").insert({
    owner_id: p.ownerId, aircraft_id: p.aircraftId ?? null, label: p.label, status: "pending_upload",
  });
  if (error) throw error;
}

// ---------- Minimal render helpers (optional) ----------
// These are tiny UI snippets you can drop into your JSX later.
// They depend only on your existing shadcn components already imported.

export function renderOwnerReservations(rows: OD_Reservation[]) {
  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming reservations.</p>
      ) : rows.map(r => (
        <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium">
              {od_fmtDateTime(r.start_at)} → {new Date(r.end_at).toLocaleTimeString()}
            </div>
            <div className="text-xs text-muted-foreground">Destination: {r.destination || "—"}</div>
          </div>
          <Badge variant="outline">{r.status || "scheduled"}</Badge>
        </div>
      ))}
    </div>
  );
}

export function renderMaintenanceDue(rows: OD_MaintDue[]) {
  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming items.</p>
      ) : rows.map(m => (
        <div key={m.id} className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{m.item}</div>
            <Badge>{m.severity || "normal"}</Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {m.due_at_hours ? `Due in ${m.remaining_hours ?? "?"} hrs` : null}
            {m.due_at_hours && m.due_at_date ? " • " : null}
            {m.due_at_date ? `Due by ${od_fmtDate(m.due_at_date)}` : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function renderConsumables(c: OD_Consumables | null) {
  if (!c) return <p className="text-sm text-muted-foreground">No consumable data yet.</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div><div className="text-xs text-muted-foreground">Oil</div><div className="text-xl font-semibold">{c.oil_qts ?? "—"} qts</div></div>
        <div><div className="text-xs text-muted-foreground">O₂</div><div className="text-xl font-semibold">{c.o2_pct ?? "—"}%</div></div>
        <div><div className="text-xs text-muted-foreground">TKS</div><div className="text-xl font-semibold">{c.tks_pct ?? "—"}%</div></div>
      </div>
      <div className="text-xs text-muted-foreground">Updated {c.last_updated ? od_fmtDateTime(c.last_updated) : "—"}</div>
    </div>
  );
}

export function renderPilotCurrency(cur: OD_PilotCurrency | null) {
  if (!cur) return <p className="text-sm text-muted-foreground">No currency data found.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div><div className="text-xs text-muted-foreground">Flight Review Due</div><div className="font-medium">{od_fmtDate(cur.fr_due)}</div></div>
      <div><div className="text-xs text-muted-foreground">IPC Due</div><div className="font-medium">{od_fmtDate(cur.ipc_due)}</div></div>
      <div><div className="text-xs text-muted-foreground">Medical Due</div><div className="font-medium">{od_fmtDate(cur.medical_due)}</div></div>
      <div><div className="text-xs text-muted-foreground">IFR 6-in-6</div><div className="font-medium">{cur.ifr_6in6_status ?? "—"}</div></div>
    </div>
  );
}

export function renderInsurance(i: OD_Insurance | null) {
  if (!i) return <p className="text-sm text-muted-foreground">No policy on file.</p>;
  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium">{i.carrier || "Carrier —"}</div>
      <div className="text-xs text-muted-foreground">Policy #{i.policy_number || "—"} • Limits {i.limits || "—"}</div>
      <div className="text-xs">Expires: <span className="font-medium">{od_fmtDate(i.expires_on)}</span></div>
    </div>
  );
}

export function renderPaymentMethods(rows: OD_PaymentMethod[]) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No payment methods saved.</p>;
  return (
    <div className="space-y-2">
      {rows.map(pm => (
        <div key={pm.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <div className="font-medium">{pm.brand || "Card"} •••• {pm.last4}</div>
            <div className="text-xs text-muted-foreground">Expires {pm.exp_month}/{pm.exp_year}</div>
          </div>
          <div className="flex items-center gap-2">
            {pm.is_default ? <Badge>Default</Badge> : <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function renderTickets(rows: OD_Ticket[]) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No recent tickets.</p>;
  return (
    <div className="space-y-2">
      {rows.map(t => (
        <div key={t.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <div className="font-medium">{t.subject}</div>
            <div className="text-xs text-muted-foreground">Updated {od_fmtDateTime(t.updated_at || t.created_at || "")}</div>
          </div>
          <Badge variant="outline">{t.status || "open"}</Badge>
        </div>
      ))}
    </div>
  );
}

// ---------- Quick role/debug utilities ----------
export async function od_getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r: any) => r.role);
}
export function od_isOwner(roles: string[]) {
  return roles.includes("owner");
}
export function od_isAdmin(roles: string[]) {
  return roles.includes("admin");
}