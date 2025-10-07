import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Calendar, Wrench } from "lucide-react";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { FlightHoursTracker } from "@/components/owner/FlightHoursTracker";

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

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Preflight Services</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule fuel, fluids, and preflight preparations
              </p>
            </CardHeader>
            <CardContent>
              <ServiceRequestDialog 
                aircraft={aircraft ? [{ ...aircraft, id: String(aircraft.id) }] : []} 
                defaultPreflight={true}
                buttonText="Prepare My Aircraft"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Flight</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No upcoming flights</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
              <Plane className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {aircraft ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                  <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                  <p className="text-sm text-muted-foreground">Base: {aircraft.base_location}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No aircraft assigned</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Open Services</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground mt-1">
                Active service requests
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlightHoursTracker />
          <CreditsOverview />
        </div>
      </div>
    </Layout>
  );
}
