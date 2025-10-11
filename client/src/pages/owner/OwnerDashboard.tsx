import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseStub";
import { useOwnerAircraft } from "@/features/owner/hooks/useOwnerAircraft";
import { AircraftHeader } from "@/features/owner/components/AircraftHeader";

import { QuickActions } from "@/features/owner/components/QuickActions";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { useEffect } from "react";

export default function OwnerDashboard() {
  const [match, params] = useRoute("/owner/:aircraftId");
  const aircraftId = params?.aircraftId;
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const {
    aircraft,
    serviceTasks,
    invoices,
    membership,
  } = useOwnerAircraft(aircraftId!, user?.id);

  // Fetch service requests
  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests", user?.id, aircraftId],
    enabled: Boolean(user?.id && aircraftId),
    queryFn: async () => {
      if (!user?.id || !aircraftId) return [];
      
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("aircraft_id", aircraftId)
        .order("requested_departure", { ascending: true, nullsFirst: false })
        .limit(20);
      
      if (error) {
        console.error("Error fetching service requests:", error);
        return [];
      }
      
      return data || [];
    }
  });

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
  useEffect(() => {
    if (aircraft.error || !aircraft.data) {
      setLocation("/dashboard");
    }
  }, [aircraft.error, aircraft.data, setLocation]);
  
  if (aircraft.error || !aircraft.data) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <AircraftHeader
          aircraft={aircraft.data}
          membership={membership.data}
          serviceTasks={serviceTasks.data || []}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions 
            aircraftId={aircraftId!} 
            userId={user!.id}
            aircraftData={aircraft.data || undefined}
          />
          <ServiceTimeline
            tasks={serviceTasks.data || []}
            requests={serviceRequests}
            isLoading={serviceTasks.isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillingCard
            invoices={invoices.data || []}
            isLoading={invoices.isLoading}
          />
          <DocsCard />
        </div>
      </div>
    </Layout>
  );
}
