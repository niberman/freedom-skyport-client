import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function FlightHoursTracker() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    aircraft_id: "",
    flight_date: format(new Date(), "yyyy-MM-dd"),
    hours_flown: "",
    departure_airport: "",
    arrival_airport: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aircraft } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: monthlyHours } = useQuery({
    queryKey: ["monthly-hours", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      
      const { data, error } = await supabase
        .from("flight_hours")
        .select("hours_flown")
        .eq("owner_id", user.id)
        .gte("flight_date", format(start, "yyyy-MM-dd"))
        .lte("flight_date", format(end, "yyyy-MM-dd"));
      
      if (error) throw error;
      
      return data.reduce((sum, entry) => sum + (entry.hours_flown || 0), 0);
    },
    enabled: !!user,
  });

  const { data: recentFlights } = useQuery({
    queryKey: ["recent-flights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("flight_hours")
        .select("*")
        .eq("owner_id", user.id)
        .order("flight_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("flight_hours").insert({
        owner_id: user.id,
        aircraft_id: data.aircraft_id,
        flight_date: data.flight_date,
        hours_flown: parseFloat(data.hours_flown),
        departure_airport: data.departure_airport || null,
        arrival_airport: data.arrival_airport || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-hours"] });
      queryClient.invalidateQueries({ queryKey: ["recent-flights"] });
      queryClient.invalidateQueries({ queryKey: ["service-credits"] });
      setOpen(false);
      resetForm();
      toast({ title: "Flight hours logged successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error logging flight hours",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      aircraft_id: aircraft?.id || "",
      flight_date: format(new Date(), "yyyy-MM-dd"),
      hours_flown: "",
      departure_airport: "",
      arrival_airport: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Flight Hours</CardTitle>
            <CardDescription>
              Track your monthly flight activity
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Log Flight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Flight Hours</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight_date">Flight Date</Label>
                    <Input
                      id="flight_date"
                      type="date"
                      value={formData.flight_date}
                      onChange={(e) =>
                        setFormData({ ...formData, flight_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours_flown">Hours Flown</Label>
                    <Input
                      id="hours_flown"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.hours_flown}
                      onChange={(e) =>
                        setFormData({ ...formData, hours_flown: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departure_airport">Departure</Label>
                    <Input
                      id="departure_airport"
                      value={formData.departure_airport}
                      onChange={(e) =>
                        setFormData({ ...formData, departure_airport: e.target.value })
                      }
                      placeholder="KAPA"
                      maxLength={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arrival_airport">Arrival</Label>
                    <Input
                      id="arrival_airport"
                      value={formData.arrival_airport}
                      onChange={(e) =>
                        setFormData({ ...formData, arrival_airport: e.target.value })
                      }
                      placeholder="KBJC"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Log Hours</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{monthlyHours?.toFixed(1) || "0.0"} hrs</p>
              </div>
            </div>
          </div>

          {recentFlights && recentFlights.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Flights</p>
              {recentFlights.map((flight) => (
                <div
                  key={flight.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(flight.flight_date), "MMM dd, yyyy")}
                    </p>
                    {flight.departure_airport && flight.arrival_airport && (
                      <p className="text-xs text-muted-foreground">
                        {flight.departure_airport} → {flight.arrival_airport}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{flight.hours_flown} hrs</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
