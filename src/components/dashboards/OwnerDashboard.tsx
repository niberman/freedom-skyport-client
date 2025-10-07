import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { Plane, Calendar, Wrench, CreditCard, Award } from "lucide-react";
export default function OwnerDashboard() {
  const {
    user
  } = useAuth();
  const {
    data: aircraft
  } = useQuery({
    queryKey: ["owner-aircraft", user?.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("aircraft").select("*").eq("owner_id", user?.id).limit(1).single();
      return data;
    }
  });
  return <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Aircraft</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {aircraft ? <div>
                  <div className="text-2xl font-bold">{aircraft.tail_number}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aircraft.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Base: {aircraft.base_location}
                  </p>
                </div> : <div className="text-sm text-muted-foreground">No aircraft assigned</div>}
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active service requests
              </p>
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Book a Flight
              </Button>
              <ServiceRequestDialog aircraft={aircraft ? [aircraft] : []} />
              
            </CardContent>
          </Card>

          <CreditsOverview />
        </div>
      </div>
    </Layout>;
}