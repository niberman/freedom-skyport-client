import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Users, Wrench, Settings } from "lucide-react";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
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
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Service Requests</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-green-600">Operational</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList>
            <TabsTrigger value="services">Service Options</TabsTrigger>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServicesManagement />
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
