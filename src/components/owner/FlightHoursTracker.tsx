import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
export function FlightHoursTracker() {
  const {
    user
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    aircraft_id: "",
    flight_date: format(new Date(), "yyyy-MM-dd"),
    hours_flown: "",
    departure_airport: "",
    arrival_airport: "",
    notes: ""
  });
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: aircraft
  } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from("aircraft").select("*").eq("owner_id", user.id).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user
  });
  const {
    data: monthlyHours
  } = useQuery({
    queryKey: ["monthly-hours", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const {
        data,
        error
      } = await supabase.from("flight_hours").select("hours_flown").eq("owner_id", user.id).gte("flight_date", format(start, "yyyy-MM-dd")).lte("flight_date", format(end, "yyyy-MM-dd"));
      if (error) throw error;
      return data.reduce((sum, entry) => sum + (entry.hours_flown || 0), 0);
    },
    enabled: !!user
  });
  const {
    data: recentFlights
  } = useQuery({
    queryKey: ["recent-flights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data,
        error
      } = await supabase.from("flight_hours").select("*").eq("owner_id", user.id).order("flight_date", {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("Not authenticated");
      const {
        error
      } = await supabase.from("flight_hours").insert({
        owner_id: user.id,
        aircraft_id: data.aircraft_id,
        flight_date: data.flight_date,
        hours_flown: parseFloat(data.hours_flown),
        departure_airport: data.departure_airport || null,
        arrival_airport: data.arrival_airport || null,
        notes: data.notes || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-hours"]
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-flights"]
      });
      queryClient.invalidateQueries({
        queryKey: ["service-credits"]
      });
      setOpen(false);
      resetForm();
      toast({
        title: "Flight hours logged successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error logging flight hours",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  useEffect(() => {
    if (aircraft?.id) {
      setFormData(current => ({
        ...current,
        aircraft_id: String(aircraft.id)
      }));
    }
  }, [aircraft]);
  const resetForm = () => {
    setFormData({
      aircraft_id: aircraft?.id ? String(aircraft.id) : "",
      flight_date: format(new Date(), "yyyy-MM-dd"),
      hours_flown: "",
      departure_airport: "",
      arrival_airport: "",
      notes: ""
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      aircraft_id: formData.aircraft_id || (aircraft?.id ? String(aircraft.id) : null)
    });
  };
  return;
}