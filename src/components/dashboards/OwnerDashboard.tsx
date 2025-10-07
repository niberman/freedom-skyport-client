import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { FlightHoursTracker } from "@/components/owner/FlightHoursTracker";
import { HoursCard } from "@/features/owner/components/HoursCard";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { toast } from "sonner";

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
        .select("*")
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
        .select("*")
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
        .select("*")
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

  // Fetch MTD hours for HoursCard
  const { data: mtdHours = 0 } = useQuery({
    queryKey: ["mtd-hours", aircraft?.id, user?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id || !user?.id) return 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("flight_hours")
        .select("hours_flown")
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .gte("flight_date", startOfMonth.toISOString().split("T")[0]);
      
      if (error) {
        console.error("Error fetching MTD hours:", error);
        return 0;
      }
      
      return data.reduce((sum, row) => sum + Number(row.hours_flown), 0);
    },
  });

  // Fetch service tasks for timeline
  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["service-tasks", aircraft?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id) return [];
      
      const { data, error } = await supabase
        .from("service_tasks")
        .select("*")
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
        .select("*")
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
        .select("*")
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

  const [openPrep, setOpenPrep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fuelGrades, setFuelGrades] = useState<string[]>(["100LL", "Jet-A", "Jet-A+", "MOGAS"]);

  // Form state for "Prepare My Aircraft"
  const [form, setForm] = useState({
    aircraft_id: "",
    airport: "",
    requested_departure: "",
    fuel_grade: "100LL",
    fuel_quantity: "",
    o2_topoff: false,
    tks_topoff: false,
    gpu_required: false,
    hangar_pullout: true,
    cabin_provisioning: "",
    description: "",
  });

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Set aircraft_id when aircraft data loads
  useEffect(() => {
    if (aircraft?.id && !form.aircraft_id) {
      setForm(f => ({ ...f, aircraft_id: aircraft.id }));
    }
  }, [aircraft?.id]);

  // Set airport from aircraft base location
  useEffect(() => {
    if (aircraft?.base_location && !form.airport) {
      setForm(f => ({ ...f, airport: (aircraft.base_location || "").toUpperCase() }));
    }
  }, [aircraft?.base_location]);

  // Optional: dynamic fuel grades from a Lovable-editable lookup
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("lookup_fuel_grades")
          .select("grade")
          .eq("active", true)
          .order("sort", { ascending: true });
        if (!error && data?.length) {
          setFuelGrades(data.map((r: any) => r.grade));
        }
      } catch (err) {
        // Table doesn't exist, use default grades
        console.log("Using default fuel grades");
      }
    })();
  }, []);

  async function submitPrepareRequest(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = {
        service_type: "Pre-Flight Concierge",
        priority: "high",
        status: "pending",
        user_id: user?.id,
        aircraft_id: form.aircraft_id || null,
        airport: form.airport?.toUpperCase() || "KAPA",
        requested_departure: form.requested_departure || null,
        fuel_grade: form.fuel_grade || null,
        fuel_quantity: form.fuel_quantity || null,
        o2_topoff: form.o2_topoff,
        tks_topoff: form.tks_topoff,
        gpu_required: form.gpu_required,
        hangar_pullout: form.hangar_pullout,
        description: form.description || "Pre-Flight Concierge Request",
        cabin_provisioning: (() => {
          const t = form.cabin_provisioning?.trim();
          if (!t) return null;
          try { 
            return JSON.parse(t); 
          } catch { 
            return t; 
          }
        })(),
      };
      
      const { error } = await supabase.from("service_requests").insert(payload);
      if (error) throw error;
      
      toast.success("Request submitted successfully!");
      setOpenPrep(false);
      setForm({
        aircraft_id: aircraft?.id || "",
        airport: aircraft?.base_location?.toUpperCase() || "",
        requested_departure: "",
        fuel_grade: fuelGrades[0] || "100LL",
        fuel_quantity: "",
        o2_topoff: false,
        tks_topoff: false,
        gpu_required: false,
        hangar_pullout: true,
        cabin_provisioning: "",
        description: "",
      });
    } catch (err) {
      console.error("[Owner Prep] submit error:", err);
      toast.error("Couldn't submit the request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Flight Concierge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tell us when you plan to fly and what you need—we'll ready your aircraft.
              </p>
              <Dialog open={openPrep} onOpenChange={setOpenPrep}>
                <DialogTrigger asChild>
                  <Button variant="default" className="w-full">Prepare My Aircraft</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Prepare My Aircraft</DialogTitle>
                    <DialogDescription>
                      Submit your pre-flight concierge request with all the details we need to prepare your aircraft.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={submitPrepareRequest} className="space-y-4">
                    {/* Aircraft & Airport */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aircraft">Aircraft</Label>
                        <Input
                          id="aircraft"
                          value={aircraft?.tail_number || "No aircraft"}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="airport">Airport</Label>
                        <Input
                          id="airport"
                          placeholder="e.g., KAPA"
                          value={form.airport}
                          onChange={(e) => updateForm("airport", e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    {/* Departure & Fuel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="requested_departure">Requested Departure</Label>
                        <Input
                          id="requested_departure"
                          type="datetime-local"
                          value={form.requested_departure}
                          onChange={(e) => updateForm("requested_departure", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fuel</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={form.fuel_grade}
                            onValueChange={(v) => updateForm("fuel_grade", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {fuelGrades.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Gallons"
                            inputMode="decimal"
                            value={form.fuel_quantity}
                            onChange={(e) => updateForm("fuel_quantity", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ground services */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="o2_topoff"
                          checked={form.o2_topoff}
                          onCheckedChange={(v) => updateForm("o2_topoff", !!v)}
                        />
                        <Label htmlFor="o2_topoff">O₂ Top-off</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tks_topoff"
                          checked={form.tks_topoff}
                          onCheckedChange={(v) => updateForm("tks_topoff", !!v)}
                        />
                        <Label htmlFor="tks_topoff">TKS Top-off</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gpu_required"
                          checked={form.gpu_required}
                          onCheckedChange={(v) => updateForm("gpu_required", !!v)}
                        />
                        <Label htmlFor="gpu_required">GPU</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hangar_pullout"
                          checked={form.hangar_pullout}
                          onCheckedChange={(v) => updateForm("hangar_pullout", !!v)}
                        />
                        <Label htmlFor="hangar_pullout">Hangar Pull-out</Label>
                      </div>
                    </div>

                    {/* Provisioning & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cabin_provisioning">Cabin Provisioning</Label>
                        <Textarea
                          id="cabin_provisioning"
                          placeholder='e.g., {"water":6,"snacks":true}'
                          value={form.cabin_provisioning}
                          onChange={(e) => updateForm("cabin_provisioning", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Notes</Label>
                        <Textarea
                          id="description"
                          placeholder="Anything else we should prepare?"
                          value={form.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter className="mt-2">
                      <Button type="button" variant="outline" onClick={() => setOpenPrep(false)}>Cancel</Button>
                      <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Request"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Flight</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextFlight ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {new Date(nextFlight.requested_departure).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextFlight.requested_departure).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{nextFlight.airport}</p>
                  {nextFlight.fuel_quantity && (
                    <p className="text-xs text-muted-foreground">
                      {nextFlight.fuel_grade}: {nextFlight.fuel_quantity} gal
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming flights</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
            <Plane className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aircraft ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                  <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                  <p className="text-sm text-muted-foreground">Base: {aircraft.base_location}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <HoursCard mtdHours={mtdHours} />
          {aircraft && user && (
            <QuickActions aircraftId={aircraft.id} userId={user.id} />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlightHoursTracker />
          <CreditsOverview />
        </div>
      </div>
    </Layout>
  );
}
