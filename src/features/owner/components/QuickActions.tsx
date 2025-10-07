import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface QuickActionsProps {
  aircraftId: string;
  userId: string;
}

export function QuickActions({ aircraftId, userId }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const [openHours, setOpenHours] = useState(false);
  const [openService, setOpenService] = useState(false);
  const [loading, setLoading] = useState(false);

  // Log Hours form
  const [hoursForm, setHoursForm] = useState({
    flight_date: new Date().toISOString().split("T")[0],
    hours_flown: "",
    departure_airport: "",
    arrival_airport: "",
    notes: "",
  });

  // Service Request form
  const [serviceForm, setServiceForm] = useState({
    type: "preflight",
    notes: "",
    requested_for: "",
  });

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from("flight_hours").insert({
        aircraft_id: aircraftId,
        owner_id: userId,
        flight_date: hoursForm.flight_date,
        hours_flown: parseFloat(hoursForm.hours_flown),
        departure_airport: hoursForm.departure_airport || null,
        arrival_airport: hoursForm.arrival_airport || null,
        notes: hoursForm.notes || null,
      });

      if (error) throw error;

      toast.success("Flight hours logged successfully!");
      setOpenHours(false);
      setHoursForm({
        flight_date: new Date().toISOString().split("T")[0],
        hours_flown: "",
        departure_airport: "",
        arrival_airport: "",
        notes: "",
      });
      
      queryClient.invalidateQueries({ queryKey: ["mtd-hours", aircraftId] });
    } catch (error) {
      console.error("Error logging hours:", error);
      toast.error("Failed to log flight hours");
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
      
      queryClient.invalidateQueries({ queryKey: ["service-tasks", aircraftId] });
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
        {/* Log Hours Dialog */}
        <Dialog open={openHours} onOpenChange={setOpenHours}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Log Flight Hours
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Flight Hours</DialogTitle>
              <DialogDescription>
                Record your flight activity for accurate tracking
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogHours} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight_date">Date</Label>
                  <Input
                    id="flight_date"
                    type="date"
                    value={hoursForm.flight_date}
                    onChange={(e) => setHoursForm({ ...hoursForm, flight_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours_flown">Hours</Label>
                  <Input
                    id="hours_flown"
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={hoursForm.hours_flown}
                    onChange={(e) => setHoursForm({ ...hoursForm, hours_flown: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure">Departure</Label>
                  <Input
                    id="departure"
                    placeholder="KAPA"
                    value={hoursForm.departure_airport}
                    onChange={(e) => setHoursForm({ ...hoursForm, departure_airport: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrival">Arrival</Label>
                  <Input
                    id="arrival"
                    placeholder="KDEN"
                    value={hoursForm.arrival_airport}
                    onChange={(e) => setHoursForm({ ...hoursForm, arrival_airport: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about the flight"
                  value={hoursForm.notes}
                  onChange={(e) => setHoursForm({ ...hoursForm, notes: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenHours(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging..." : "Log Hours"}
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
