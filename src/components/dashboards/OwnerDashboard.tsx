import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, PlaneTakeoff, Calendar, Wrench, CreditCard, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { FlightHoursTracker } from "@/components/owner/FlightHoursTracker";

export default function OwnerDashboard() {
  const { user } = useAuth();
  
  const { data: aircraft } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
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

  const [openPrep, setOpenPrep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fuelGrades, setFuelGrades] = useState<string[]>(["100LL","Jet-A","Jet-A+","MOGAS"]);

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

  const selectedAircraft = useMemo(() => {
    if (!aircraft) return undefined;
    if (Array.isArray(aircraft)) {
      return aircraft.find((a: any) => a.id === form.aircraft_id);
    }
    // aircraft is a single object
    return (aircraft as any).id === form.aircraft_id ? aircraft : undefined;
  }, [aircraft, form.aircraft_id]);

  useEffect(() => {
    if (selectedAircraft?.base_location && !form.airport) {
      setForm(f => ({ ...f, airport: (selectedAircraft.base_location || "").toUpperCase() }));
    }
  }, [selectedAircraft]);

  // Optional: dynamic fuel grades from a Lovable-editable lookup
  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("lookup_fuel_grades")
        .select("grade")
        .eq("active", true)
        .order("sort", { ascending: true });
      if (!error && data?.length) {
        setFuelGrades(data.map((r: any) => r.grade));
      }
    })();
  }, []);

  async function submitPrepareRequest(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = {
        ...form,
        service_type: "Pre-Flight Concierge",
        priority: "high",
        status: "pending",
        user_id: user?.id,
        cabin_provisioning: (() => {
          const t = form.cabin_provisioning?.trim();
          if (!t) return {};
          try { return JSON.parse(t); } catch { return t; }
        })(),
        airport: form.airport?.toUpperCase() || null,
      };
      const { error } = await (supabase as any).from("service_requests").insert(payload);
      if (error) throw error;
      setOpenPrep(false);
      setForm({
        aircraft_id: "",
        airport: "",
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
      alert("Couldn’t submit the request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const normalizedAircraft = useMemo(() => {
    if (!aircraft) return [];
    // If aircraft query returned an array, map each entry
    if (Array.isArray(aircraft)) {
      return aircraft.map((a: any) => ({
        id: String(a.id),
        tail_number: a.tail_number ?? a.tail ?? String(a.id),
        base_location: a.base_location ?? a.baseLocation ?? undefined,
      }));
    }
    // Single object case
    const a = aircraft as any;
    return [{
      id: String(a.id),
      tail_number: a.tail_number ?? a.tail ?? String(a.id),
      base_location: a.base_location ?? a.baseLocation ?? undefined,
    }];
  }, [aircraft]);

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PlaneTakeoff className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Flight Ready</CardTitle>
                  <p className="text-sm text-muted-foreground">Status and quick actions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add any body content here if needed */}
            </CardContent>
          </Card>

          <Card>
    <CardHeader className="flex items-center justify-between">
      <CardTitle>Pre-Flight Concierge</CardTitle>
      <Dialog open={openPrep} onOpenChange={setOpenPrep}>
        <DialogTrigger asChild>
          <Button variant="default">Prepare My Aircraft</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare My Aircraft</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPrepareRequest} className="space-y-4">
            {/* Aircraft & Airport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft</Label>
                <Select
                  value={form.aircraft_id}
                  onValueChange={(v) => updateForm("aircraft_id", v)}
                >
                  <SelectTrigger id="aircraft">
                    <SelectValue placeholder={normalizedAircraft.length ? "Select aircraft" : "No aircraft available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {normalizedAircraft.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tail_number}
                      </SelectItem>
                    ))}
                    {!normalizedAircraft.length && (
                      <SelectItem value="">
                        (No aircraft found)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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
    </CardHeader>
            <CardContent>
              <ServiceRequestDialog
                aircraft={normalizedAircraft}
                defaultPreflight={true}
                buttonText="Prepare My Aircraft"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-xl">Preflight Services</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule fuel, fluids, and preflight preparations
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ServiceRequestDialog 
                aircraft={normalizedAircraft} 
                defaultPreflight={true}
                buttonText="Prepare My Aircraft"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
              <Plane className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {aircraft ? (
                Array.isArray(aircraft) && aircraft.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{aircraft[0].tail_number}</div>
                    <p className="text-sm text-muted-foreground">{aircraft[0].model}</p>
                    <p className="text-sm text-muted-foreground">Base: {aircraft[0].base_location}</p>
                  </div>
                ) : !Array.isArray(aircraft) ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                    <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                    <p className="text-sm text-muted-foreground">Base: {aircraft.base_location}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No aircraft assigned</div>
                )
              ) : (
                <div className="text-sm text-muted-foreground">No aircraft assigned</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Open Services</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground mt-1">
                Active service requests
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlightHoursTracker />
          <CreditsOverview />
        </div>
      </div>
    </Layout>
  );
}
