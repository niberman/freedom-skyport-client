import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface ServiceRequestDialogProps {
  aircraft: Array<{ id: string; tail_number: string; base_location?: string }>;
}

export function ServiceRequestDialog({ aircraft }: ServiceRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const singleAircraft = aircraft.length === 1 ? aircraft[0] : null;
  const [formData, setFormData] = useState({
    aircraft_id: singleAircraft?.id || "",
    service_id: "",
    service_type: "",
    description: "",
    priority: "medium",
    airport: singleAircraft?.base_location || "KAPA",
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["active-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: serviceCredits } = useQuery({
    queryKey: ["service-credits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_credits")
        .select("*")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getServiceCredits = (serviceId: string) => {
    return serviceCredits?.find((sc) => sc.service_id === serviceId);
  };

  const hasEnoughCredits = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    const credits = getServiceCredits(serviceId);
    if (!service) return false;
    return (credits?.credits_available || 0) >= (service.credits_required || 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const selectedService = services?.find((s) => s.id === formData.service_id);
      const hasCredits = formData.service_id && formData.service_id !== "custom" 
        ? hasEnoughCredits(formData.service_id) 
        : false;
      
      const { error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        aircraft_id: formData.aircraft_id,
        service_id: formData.service_id === "custom" ? null : formData.service_id || null,
        service_type: formData.service_id && formData.service_id !== "custom" ? selectedService?.name || "" : formData.service_type,
        description: formData.description,
        priority: formData.priority,
        airport: formData.airport,
        is_extra_charge: !hasCredits,
        credits_used: hasCredits ? (selectedService?.credits_required || 0) : 0,
      });

      if (error) throw error;

      toast({
        title: "Service request submitted",
        description: hasCredits 
          ? "Your credits will be deducted upon approval." 
          : "This will be billed as an extra charge.",
      });

      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-credits"] });
      setOpen(false);
      setFormData({
        aircraft_id: singleAircraft?.id || "",
        service_id: "",
        service_type: "",
        description: "",
        priority: "medium",
        airport: singleAircraft?.base_location || "KAPA",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          Request Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {singleAircraft ? (
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <div className="text-sm font-medium px-3 py-2 bg-muted rounded-md">
                {singleAircraft.tail_number}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select
                value={formData.aircraft_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, aircraft_id: value })
                }
                required
              >
                <SelectTrigger id="aircraft">
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tail_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) =>
                setFormData({ ...formData, service_id: value, service_type: "" })
              }
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service or choose custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom / Special Request</SelectItem>
                {services?.map((service) => {
                  const credits = getServiceCredits(service.id);
                  const hasCredits = hasEnoughCredits(service.id);
                  return (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.category})
                      {credits && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          - {credits.credits_available}/{service.credits_per_period} credits
                          {!hasCredits && " (extra charge)"}
                        </span>
                      )}
                      {!credits && service.credits_required > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (extra charge)
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {formData.service_id === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom_service_type">Custom Service Type</Label>
              <Input
                id="custom_service_type"
                value={formData.service_type}
                onChange={(e) =>
                  setFormData({ ...formData, service_type: e.target.value })
                }
                placeholder="Enter custom service type..."
                required
                maxLength={100}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="airport">Service Location</Label>
            <Select
              value={formData.airport}
              onValueChange={(value) =>
                setFormData({ ...formData, airport: value })
              }
              required
            >
              <SelectTrigger id="airport">
                <SelectValue placeholder="Select airport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KAPA">KAPA - Centennial Airport</SelectItem>
                <SelectItem value="BJC">BJC - Rocky Mountain Metro</SelectItem>
                <SelectItem value="KEGE">KEGE - Eagle County</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the service you need..."
              rows={4}
              maxLength={1000}
            />
          </div>

          {formData.service_id && formData.service_id !== "custom" && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {hasEnoughCredits(formData.service_id) ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ This service will use your available credits
                </p>
              ) : (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠ No credits available - this will be billed as an extra charge
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
