import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseStub";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface ServiceRequestDialogProps {
  aircraft: Array<{
    id: string;
    tail_number: string;
    base_location?: string;
  }>;
  defaultPreflight?: boolean;
  buttonText?: string;
}
export function ServiceRequestDialog({
  aircraft,
  defaultPreflight = false,
  buttonText = "Request Service"
}: ServiceRequestDialogProps) {
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
    is_preflight: defaultPreflight,
    flight_time: undefined as Date | undefined,
    fuel_request: "",
    fluid_request: ""
  });
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: services
  } = useQuery({
    queryKey: ["active-services"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("services").select("*").eq("is_active", true).order("category", {
        ascending: true
      }).order("name", {
        ascending: true
      });
      if (error) throw error;
      return data;
    }
  });
  const {
    data: serviceCredits
  } = useQuery({
    queryKey: ["service-credits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data,
        error
      } = await supabase.from("service_credits").select("*").eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const getServiceCredits = (serviceId: string) => {
    return serviceCredits?.find(sc => sc.service_id === serviceId);
  };
  const hasEnoughCredits = (serviceId: string) => {
    const service = services?.find(s => s.id === serviceId);
    const credits = getServiceCredits(serviceId);
    if (!service) return false;
    return (credits?.credits_available || 0) >= (service.credits_required || 1);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const selectedService = services?.find(s => s.id === formData.service_id);
      const hasCredits = formData.service_id && formData.service_id !== "custom" ? hasEnoughCredits(formData.service_id) : false;

      // Build description with preflight details if applicable
      let finalDescription = formData.description;
      if (formData.is_preflight) {
        const preflightDetails = [];
        if (formData.flight_time) {
          preflightDetails.push(`Flight Time: ${format(formData.flight_time, "PPP p")}`);
        }
        if (formData.fuel_request) {
          preflightDetails.push(`Fuel: ${formData.fuel_request}`);
        }
        if (formData.fluid_request) {
          preflightDetails.push(`Fluids: ${formData.fluid_request}`);
        }
        finalDescription = `[PREFLIGHT SERVICE]\n${preflightDetails.join('\n')}${formData.description ? '\n\nAdditional Notes:\n' + formData.description : ''}`;
      }
      const {
        error
      } = await supabase.from("service_requests").insert({
        user_id: user.id,
        aircraft_id: formData.aircraft_id || null,
        service_id: formData.service_id === "custom" || !formData.service_id ? null : formData.service_id,
        service_type: formData.service_id && formData.service_id !== "custom" ? selectedService?.name || "" : formData.service_type,
        description: finalDescription,
        priority: formData.priority,
        airport: formData.airport,
        is_extra_charge: !hasCredits,
        credits_used: hasCredits ? selectedService?.credits_required || 0 : 0
      });
      if (error) throw error;
      toast({
        title: "Service request submitted",
        description: defaultPreflight ? "Your preflight request has been submitted." : hasCredits ? "Your credits will be deducted upon approval." : "This will be billed as an extra charge."
      });
      
      // Invalidate all service-requests queries (including those with user/aircraft IDs)
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-requests"
      });
      
      // Also invalidate service tasks and credits
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-tasks"
      });
      
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-credits"
      });
      setOpen(false);
      setFormData({
        aircraft_id: singleAircraft?.id || "",
        service_id: "",
        service_type: "",
        description: "",
        priority: "medium",
        airport: singleAircraft?.base_location || "KAPA",
        is_preflight: defaultPreflight,
        flight_time: undefined,
        fuel_request: "",
        fluid_request: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {singleAircraft ? <div className="space-y-2">
              <Label>Aircraft</Label>
              <div className="text-sm font-medium px-3 py-2 bg-muted rounded-md">
                {singleAircraft.tail_number}
              </div>
            </div> : <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select value={formData.aircraft_id} onValueChange={value => setFormData({
            ...formData,
            aircraft_id: value
          })} required>
                <SelectTrigger id="aircraft">
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map(a => <SelectItem key={a.id} value={a.id}>
                      {a.tail_number}
                    </SelectItem>)}
                </SelectContent>
              </Select>
          </div>}

          {!defaultPreflight && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select a service or custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.reduce((acc, service) => {
                      const category = service.category;
                      if (!acc.find((item: any) => item.category === category)) {
                        acc.push({ category, services: [] });
                      }
                      acc.find((item: any) => item.category === category).services.push(service);
                      return acc;
                    }, [] as any[]).map((group) => (
                      <div key={group.category}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {group.category}
                        </div>
                        {group.services.map((service: any) => {
                          const credits = getServiceCredits(service.id);
                          return (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{service.name}</span>
                                {credits && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({credits.credits_available} credits)
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    ))}
                    <SelectItem value="custom">Custom Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.service_id === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_service_type">Custom Service Type</Label>
                  <Input
                    id="custom_service_type"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    placeholder="Enter custom service type..."
                    required
                    maxLength={100}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.service_id === "custom" && <div className="space-y-2">
              <Label htmlFor="custom_service_type">Custom Service Type</Label>
              <Input id="custom_service_type" value={formData.service_type} onChange={e => setFormData({
            ...formData,
            service_type: e.target.value
          })} placeholder="Enter custom service type..." required maxLength={100} />
            </div>}

          <div className="space-y-2">
            <Label htmlFor="airport">Service Location</Label>
            <Select value={formData.airport} onValueChange={value => setFormData({
            ...formData,
            airport: value
          })} required>
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

          

          {!defaultPreflight && <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="preflight" checked={formData.is_preflight} onCheckedChange={checked => setFormData({
            ...formData,
            is_preflight: checked as boolean
          })} />
              <Label htmlFor="preflight" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                This is a preflight service request
              </Label>
            </div>}

          {formData.is_preflight && <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm">Preflight Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="flight_time">Approximate Flight Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="flight_time" variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.flight_time && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.flight_time ? format(formData.flight_time, "PPP p") : <span>Pick a date and time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.flight_time} onSelect={date => setFormData({
                  ...formData,
                  flight_time: date
                })} disabled={date => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }} initialFocus className={cn("p-3 pointer-events-auto")} />
                    <div className="p-3 border-t">
                      <Label htmlFor="time" className="text-xs">Time (Optional)</Label>
                      <Input id="time" type="time" onChange={e => {
                    if (formData.flight_time && e.target.value) {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(formData.flight_time);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData({
                        ...formData,
                        flight_time: newDate
                      });
                    }
                  }} className="mt-1" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_request">Fuel Request</Label>
                <Input id="fuel_request" value={formData.fuel_request} onChange={e => setFormData({
              ...formData,
              fuel_request: e.target.value
            })} placeholder="e.g., Full tanks, 50 gallons, etc." maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fluid_request">Fluid Request (Optional)</Label>
                <Input id="fluid_request" value={formData.fluid_request} onChange={e => setFormData({
              ...formData,
              fluid_request: e.target.value
            })} placeholder="e.g., Oil check, top off all fluids, etc." maxLength={200} />
              </div>
            </div>}

          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.is_preflight ? "Additional Notes (Optional)" : "Description (Optional)"}
            </Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder={formData.is_preflight ? "Any other special requests or notes..." : "Describe the service you need..."} rows={4} maxLength={1000} />
          </div>

          {!defaultPreflight && formData.service_id && formData.service_id !== "custom" && <div className="rounded-md bg-muted p-3 text-sm">
              {hasEnoughCredits(formData.service_id) ? <p className="text-green-600 dark:text-green-400">
                  ✓ This service will use your available credits
                </p> : <p className="text-amber-600 dark:text-amber-400">
                  ⚠ No credits available - this will be billed as an extra charge
                </p>}
            </div>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>;
}