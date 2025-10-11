import { useQuery } from "@tanstack/react-query";
import type { Aircraft, ServiceTask, Invoice, Membership } from "../types";

export function useOwnerAircraft(aircraftId: string, userId: string | undefined) {
  // Fetch aircraft details
  const aircraft = useQuery<Aircraft>({
    queryKey: ["/api/aircraft", aircraftId],
    enabled: Boolean(aircraftId && userId),
  });

  // Fetch service tasks
  const serviceTasks = useQuery<ServiceTask[]>({
    queryKey: ["/api/service-tasks", { aircraftId }],
    enabled: Boolean(aircraftId && userId),
  });

  // Fetch invoices
  const invoices = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", { aircraftId, ownerId: userId }],
    enabled: Boolean(aircraftId && userId),
  });

  // Fetch membership
  const membership = useQuery<Membership | null>({
    queryKey: ["/api/memberships", { ownerId: userId, active: true }],
    enabled: Boolean(userId),
  });

  return {
    aircraft,
    serviceTasks,
    invoices,
    membership,
  };
}
