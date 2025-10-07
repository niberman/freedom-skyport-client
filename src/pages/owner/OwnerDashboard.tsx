import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerAircraft } from "@/features/owner/hooks/useOwnerAircraft";
import { AircraftHeader } from "@/features/owner/components/AircraftHeader";
import { HoursCard } from "@/features/owner/components/HoursCard";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";

export default function OwnerDashboard() {
  const { aircraftId } = useParams<{ aircraftId: string }>();
  const { user } = useAuth();

  const {
    aircraft,
    mtdHours,
    serviceTasks,
    invoices,
    membership,
  } = useOwnerAircraft(aircraftId!, user?.id);

  // Show loading state
  if (aircraft.isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect if no access or aircraft not found
  if (aircraft.error || !aircraft.data) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <AircraftHeader
          aircraft={aircraft.data}
          membership={membership.data}
          serviceTasks={serviceTasks.data || []}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <HoursCard mtdHours={mtdHours.data || 0} />
          <QuickActions aircraftId={aircraftId!} userId={user!.id} />
          <BillingCard
            invoices={invoices.data || []}
            isLoading={invoices.isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceTimeline
            tasks={serviceTasks.data || []}
            isLoading={serviceTasks.isLoading}
          />
          <DocsCard />
        </div>
      </div>
    </Layout>
  );
}
