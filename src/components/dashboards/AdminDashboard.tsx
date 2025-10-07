import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Users, Calendar, Wrench, CreditCard, Activity, Settings } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { FlightHoursManagement } from "@/components/admin/FlightHoursManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [openInfo, setOpenInfo] = useState(false);
  const defaultCounts = { aircraft: 0, owners: 0, openServices: 0, upcomingFlights: 0 };

  const { data: counts = defaultCounts } = useQuery({
    queryKey: ["admin-dashboard-counts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [aircraftRes, ownerRes, serviceRes] = await Promise.all([
        supabase.from("aircraft").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        (supabase as any)
          .from("service_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
      ]);

      const errors = [aircraftRes.error, ownerRes.error, serviceRes.error].filter(Boolean);
      if (errors.length) {
        throw new Error(
          errors
            .map((error) => (typeof error === "object" && error !== null ? (error as Error).message : String(error)))
            .join("; ")
        );
      }

      return {
        aircraft: aircraftRes.count ?? 0,
        owners: ownerRes.count ?? 0,
        openServices: serviceRes.count ?? 0,
        upcomingFlights: 0,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage Freedom Aviation operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.aircraft ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.owners ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Service Requests</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.upcomingFlights ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.openServices ?? 0}</div>
              <div className="text-sm text-green-600">Operational</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={openInfo} onOpenChange={setOpenInfo}>
                  <DialogTrigger asChild>
                    <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left w-full">
                      <Plane className="h-5 w-5 mb-2 text-primary" />
                      <p className="text-sm font-medium">Prepare My Aircraft</p>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Prepare My Aircraft</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Owners can submit pre-flight concierge requests from their dashboard.
                      As an admin, use the Owner view or create a request directly in Lovable under <code>service_requests</code>.
                    </p>
                    <div className="mt-3">
                      <a href="/owner" className="text-primary underline">Open Owner Dashboard</a>
                    </div>
                  </DialogContent>
                </Dialog>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Users className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">View Owners</p>
                </button>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Calendar className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">View Calendar</p>
                </button>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Wrench className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">Service Queue</p>
                </button>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <CreditCard className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">Billing</p>
                </button>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Activity className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">Activity Log</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList>
            <TabsTrigger value="services">Service Options</TabsTrigger>
            <TabsTrigger value="flight-hours">Flight Hours</TabsTrigger>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServicesManagement />
          </TabsContent>

          <TabsContent value="flight-hours">
            <FlightHoursManagement />
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Service requests management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aircraft">
            <Card>
              <CardHeader>
                <CardTitle>Aircraft Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Aircraft management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
