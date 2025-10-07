import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Users, Calendar, Wrench, CreditCard, Activity } from "lucide-react";
//test comment
export default function AdminDashboard() {

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Flights</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
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
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Plane className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">Manage Aircraft</p>
                </button>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity to display</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
