import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plane, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseStub";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface QuickActionsProps {
  aircraftId: string;
  userId: string;
  aircraftData?: {
    id: string;
    tail_number: string;
    base_location: string | null;
  };
}

export function QuickActions({ aircraftId, userId, aircraftData }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const [openPrep, setOpenPrep] = useState(false);
  const [openService, setOpenService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fuelGrades] = useState<string[]>(["100LL", "Jet-A", "Jet-A+", "MOGAS"]);

  // Pre-Flight Concierge form
  const [prepForm, setPrepForm] = useState({
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

  // Service Request form
  const [serviceForm, setServiceForm] = useState({
    type: "preflight",
    notes: "",
    requested_for: "",
  });

  // Set aircraft_id and airport when aircraft data loads
  useEffect(() => {
    if (aircraftData?.id && !prepForm.aircraft_id) {
      setPrepForm(f => ({ 
        ...f, 
        aircraft_id: aircraftData.id,
        airport: (aircraftData.base_location || "KAPA").toUpperCase()
      }));
    }
  }, [aircraftData]);

  const handlePrepareAircraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload: any = {
        service_type: "Pre-Flight Concierge",
        priority: "high",
        status: "pending",
        user_id: userId,
        aircraft_id: prepForm.aircraft_id || null,
        airport: prepForm.airport?.toUpperCase() || "KAPA",
        requested_departure: prepForm.requested_departure || null,
        fuel_grade: prepForm.fuel_grade || null,
        fuel_quantity: prepForm.fuel_quantity || null,
        o2_topoff: prepForm.o2_topoff,
        tks_topoff: prepForm.tks_topoff,
        gpu_required: prepForm.gpu_required,
        hangar_pullout: prepForm.hangar_pullout,
        description: prepForm.description || "Pre-Flight Concierge Request",
        cabin_provisioning: (() => {
          const t = prepForm.cabin_provisioning?.trim();
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
      
      toast.success("Pre-flight request submitted successfully!");
      setOpenPrep(false);
      setPrepForm({
        aircraft_id: aircraftData?.id || "",
        airport: aircraftData?.base_location?.toUpperCase() || "",
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
      
      // Invalidate all relevant queries using predicate to match all variations
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-requests"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-tasks"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "next-flight"
      });
    } catch (error) {
      console.error("Error submitting pre-flight request:", error);
      toast.error("Failed to submit pre-flight request");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from("service_requests").insert({
        aircraft_id: aircraftId,
        user_id: userId,
        service_type: serviceForm.type,
        description: serviceForm.notes || `Service request: ${serviceForm.type}`,
        status: "pending",
        priority: "medium",
        requested_departure: serviceForm.requested_for || null,
      });

      if (error) throw error;

      toast.success("Service request submitted!");
      setOpenService(false);
      setServiceForm({
        type: "preflight",
        notes: "",
        requested_for: "",
      });
      
      // Invalidate all relevant queries using predicate
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-requests"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-tasks"
      });
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error("Failed to submit service request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Prepare My Aircraft Dialog */}
        <Dialog open={openPrep} onOpenChange={setOpenPrep}>
          <DialogTrigger asChild>
            <Button variant="default" className="w-full justify-start">
              <Plane className="mr-2 h-4 w-4" />
              Prepare My Aircraft
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prepare My Aircraft</DialogTitle>
              <DialogDescription>
                Submit your pre-flight concierge request with all the details we need to prepare your aircraft.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePrepareAircraft} className="space-y-4">
              {/* Aircraft & Airport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_aircraft">Aircraft</Label>
                  <Input
                    id="prep_aircraft"
                    value={aircraftData?.tail_number || "No aircraft"}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep_airport">Airport</Label>
                  <Input
                    id="prep_airport"
                    placeholder="e.g., KAPA"
                    value={prepForm.airport}
                    onChange={(e) => setPrepForm({ ...prepForm, airport: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              {/* Departure & Fuel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_departure">Requested Departure *</Label>
                  <Input
                    id="prep_departure"
                    type="datetime-local"
                    value={prepForm.requested_departure}
                    onChange={(e) => setPrepForm({ ...prepForm, requested_departure: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuel</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={prepForm.fuel_grade}
                      onValueChange={(v) => setPrepForm({ ...prepForm, fuel_grade: v })}
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
                      value={prepForm.fuel_quantity}
                      onChange={(e) => setPrepForm({ ...prepForm, fuel_quantity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Ground services */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prep_o2"
                    checked={prepForm.o2_topoff}
                    onCheckedChange={(v) => setPrepForm({ ...prepForm, o2_topoff: !!v })}
                  />
                  <Label htmlFor="prep_o2">O₂ Top-off</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prep_tks"
                    checked={prepForm.tks_topoff}
                    onCheckedChange={(v) => setPrepForm({ ...prepForm, tks_topoff: !!v })}
                  />
                  <Label htmlFor="prep_tks">TKS Top-off</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prep_gpu"
                    checked={prepForm.gpu_required}
                    onCheckedChange={(v) => setPrepForm({ ...prepForm, gpu_required: !!v })}
                  />
                  <Label htmlFor="prep_gpu">GPU</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prep_hangar"
                    checked={prepForm.hangar_pullout}
                    onCheckedChange={(v) => setPrepForm({ ...prepForm, hangar_pullout: !!v })}
                  />
                  <Label htmlFor="prep_hangar">Hangar Pull-out</Label>
                </div>
              </div>

              {/* Provisioning & Notes */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_provisioning">Cabin Provisioning</Label>
                  <Textarea
                    id="prep_provisioning"
                    placeholder="Water, snacks, etc."
                    value={prepForm.cabin_provisioning}
                    onChange={(e) => setPrepForm({ ...prepForm, cabin_provisioning: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep_description">Additional Notes</Label>
                  <Textarea
                    id="prep_description"
                    placeholder="Any special requests or instructions"
                    value={prepForm.description}
                    onChange={(e) => setPrepForm({ ...prepForm, description: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenPrep(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Request Service Dialog */}
        <Dialog open={openService} onOpenChange={setOpenService}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Wrench className="mr-2 h-4 w-4" />
              Request Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Service</DialogTitle>
              <DialogDescription>
                Submit a service request for your aircraft
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Service Type</Label>
                <Select
                  value={serviceForm.type}
                  onValueChange={(v) => setServiceForm({ ...serviceForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preflight">Pre-Flight Concierge</SelectItem>
                    <SelectItem value="full_detail">Full Detail</SelectItem>
                    <SelectItem value="oil">Oil Service</SelectItem>
                    <SelectItem value="o2">O₂ Service</SelectItem>
                    <SelectItem value="tks">TKS Service</SelectItem>
                    <SelectItem value="db_update">Database Update</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested_for">Requested Time (Optional)</Label>
                <Input
                  id="requested_for"
                  type="datetime-local"
                  value={serviceForm.requested_for}
                  onChange={(e) => setServiceForm({ ...serviceForm, requested_for: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_notes">Notes</Label>
                <Textarea
                  id="service_notes"
                  placeholder="Describe what you need"
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenService(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
