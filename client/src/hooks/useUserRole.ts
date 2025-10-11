import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type UserRole = "owner" | "admin";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["/api/users", user?.id, "roles"],
    enabled: !!user?.id,
    select: (data: { role: UserRole }[]) => {
      // Handle multiple roles - prioritize admin > owner
      if (!data || data.length === 0) return null;
      
      const roles = data.map(r => r.role);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("owner")) return "owner";
      
      return null;
    },
  });
}
