import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface QuickActionsProps {
  aircraftId: string;
  userId: string;
}

export function QuickActions({ aircraftId, userId }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const [openService, setOpenService] = useState(false);
  const [loading, setLoading] = useState(false);

  // Service Request form
  const [serviceForm, setServiceForm] = useState({
    type: "preflight",
    notes: "",
    requested_for: "",
  });

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
