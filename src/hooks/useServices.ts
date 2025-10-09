import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean | null;
  credits_required: number | null;
  credits_per_period: number | null;
  can_rollover: boolean | null;
  base_credits_low_activity: number | null;
  base_credits_high_activity: number | null;
}

/**
 * useServices - fetches all service definitions (optionally filtered by active state)
 * @param opts.activeOnly when true returns only active services
 */
export function useServices(opts: { activeOnly?: boolean } = {}) {
  const { activeOnly } = opts;
  return useQuery({
    queryKey: ["services", { activeOnly }],
    queryFn: async (): Promise<ServiceRecord[]> => {
      let query = supabase
        .from("services")
        .select(
          "id, name, description, category, is_active, credits_required, credits_per_period, can_rollover, base_credits_low_activity, base_credits_high_activity"
        )
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (activeOnly) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceRecord[];
    },
  });
}
