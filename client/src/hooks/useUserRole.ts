import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type UserRole = "owner" | "admin";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [`/api/users/${user?.id}/roles`],
    enabled: !!user?.id,
    select: (data: string[]) => {
      // API returns array of role strings like ["owner"] or ["admin"]
      if (!data || data.length === 0) return null;
      
      // Prioritize admin > owner if user has multiple roles
      if (data.includes("admin")) return "admin" as UserRole;
      if (data.includes("owner")) return "owner" as UserRole;
      
      return null;
    },
  });
}
