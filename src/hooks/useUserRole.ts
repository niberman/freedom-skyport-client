import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "owner" | "instructor" | "admin";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Handle multiple roles - prioritize admin > instructor > owner
      if (!data || data.length === 0) return null;
      
      const roles = data.map(r => r.role as UserRole);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("instructor")) return "instructor";
      if (roles.includes("owner")) return "owner";
      
      return null;
    },
    enabled: !!user,
  });
}
