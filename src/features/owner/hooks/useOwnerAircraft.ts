import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Aircraft, ServiceTask, Invoice, FlightHour, Membership } from "../types";

export function useOwnerAircraft(aircraftId: string, userId: string | undefined) {
  // Fetch aircraft details
  const aircraft = useQuery({
    queryKey: ["aircraft", aircraftId],
    enabled: Boolean(aircraftId && userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("id", aircraftId)
        .eq("owner_id", userId)
        .single();
      
      if (error) throw error;
      return data as Aircraft;
    },
  });

  // Fetch MTD hours
  const mtdHours = useQuery({
    queryKey: ["mtd-hours", aircraftId],
    enabled: Boolean(aircraftId && userId),
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("flight_hours")
        .select("hours_flown")
        .eq("aircraft_id", aircraftId)
        .eq("owner_id", userId)
        .gte("flight_date", startOfMonth.toISOString().split("T")[0]);
      
      if (error) throw error;
      
      const total = data.reduce((sum, row) => sum + Number(row.hours_flown), 0);
      return total;
    },
  });

  // Fetch service tasks
  const serviceTasks = useQuery({
    queryKey: ["service-tasks", aircraftId],
    enabled: Boolean(aircraftId && userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_tasks")
        .select("*")
        .eq("aircraft_id", aircraftId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ServiceTask[];
    },
  });

  // Fetch invoices
  const invoices = useQuery({
    queryKey: ["invoices", aircraftId],
    enabled: Boolean(aircraftId && userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("aircraft_id", aircraftId)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as Invoice[];
    },
  });

  // Fetch membership
  const membership = useQuery({
    queryKey: ["membership", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("owner_id", userId)
        .eq("active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Membership | null;
    },
  });

  return {
    aircraft,
    mtdHours,
    serviceTasks,
    invoices,
    membership,
  };
}
