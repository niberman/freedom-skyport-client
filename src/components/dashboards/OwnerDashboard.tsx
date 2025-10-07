import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";

export default function OwnerDashboard() {
  const { user } = useAuth();
  
  const { data: aircraft } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user?.id)
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const { data: nextFlight, refetch: refetchNextFlight } = useQuery({
    queryKey: ["next-flight", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user?.id)
        .eq("service_type", "Pre-Flight Concierge")
        .not("requested_departure", "is", null)
        .gte("requested_departure", new Date().toISOString())
        .order("requested_departure", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const { data: serviceRequests = [], refetch: refetchServiceRequests } = useQuery({
    queryKey: ["service-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Error fetching service requests:", error);
        return [];
      }
      
      return data || [];
    }
  });


  // Fetch service tasks for timeline
  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["service-tasks", aircraft?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id) return [];
      
      const { data, error } = await supabase
        .from("service_tasks")
        .select("*")
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching service tasks:", error);
        return [];
      }
      
      // Transform the data to match ServiceTask type
      return data.map((task) => ({
        id: task.id,
        aircraft_id: task.aircraft_id,
        type: task.type,
        status: task.status,
        assigned_to: task.assigned_to,
        notes: task.notes,
        photos: Array.isArray(task.photos) ? task.photos.filter((p): p is string => typeof p === 'string') : [],
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));
    },
  });

  // Fetch invoices for billing
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", aircraft?.id, user?.id],
    enabled: Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (!aircraft?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }
      
      return data;
    },
  });

  // Fetch membership
  const { data: membership = null } = useQuery({
    queryKey: ["membership", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("owner_id", user.id)
        .eq("active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching membership:", error);
        return null;
      }
      
      return data;
    },
  });

  // Real-time subscription for service requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetchNextFlight();
          refetchServiceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetchServiceRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchNextFlight, refetchServiceRequests]);

  // Calculate readiness status
  const readinessTypes = [
    "readiness",
    "clean",
    "detail",
    "oil",
    "o2",
    "tks",
    "db_update",
  ];
  
  const hasOpenTask = serviceTasks.some(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      readinessTypes.some((type) => task.type.toLowerCase().includes(type))
  );

  const readinessStatus = hasOpenTask ? "Needs Service" : "Ready";
  const readinessVariant = hasOpenTask ? "destructive" : "default";

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Flight</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextFlight ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {new Date(nextFlight.requested_departure).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextFlight.requested_departure).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{nextFlight.airport}</p>
                  {nextFlight.fuel_quantity && (
                    <p className="text-xs text-muted-foreground">
                      {nextFlight.fuel_grade}: {nextFlight.fuel_quantity} gal
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming flights</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
            <Plane className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aircraft ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                  <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                  <p className="text-sm text-muted-foreground">Base: {aircraft.base_location}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {membership && (
                    <Badge variant="secondary">
                      {membership.tier}
                    </Badge>
                  )}
                  <Badge variant={readinessVariant as any}>
                    {readinessStatus}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No aircraft assigned</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aircraft && user && (
            <QuickActions 
              aircraftId={aircraft.id} 
              userId={user.id}
              aircraftData={aircraft}
            />
          )}
          <BillingCard invoices={invoices} isLoading={invoicesLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceTimeline 
            tasks={serviceTasks} 
            requests={serviceRequests}
            isLoading={tasksLoading} 
          />
          <DocsCard />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <CreditsOverview />
        </div>
      </div>
    </Layout>
  );
}
