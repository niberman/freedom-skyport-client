import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Aircraft, ServiceTask, Invoice, Membership } from "../types";

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
    serviceTasks,
    invoices,
    membership,
  };
}
