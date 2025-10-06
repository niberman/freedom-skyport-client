import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, Users, Wrench, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Aircraft {
  id: string;
  tail_number: string;
  model: string;
  owner_id: string;
  status: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [stats, setStats] = useState({
    totalAircraft: 0,
    activeMembers: 0,
    pendingMaintenance: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all aircraft
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*');

      if (aircraftError) throw aircraftError;

      // Fetch profiles separately
      const ownerIds = aircraftData?.map(a => a.owner_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ownerIds);

      // Map profiles to aircraft
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const enrichedAircraft = aircraftData?.map(ac => ({
        ...ac,
        profiles: ac.owner_id ? profilesMap.get(ac.owner_id) : undefined,
      })) || [];

      setAircraft(enrichedAircraft);
      setStats({
        totalAircraft: aircraftData?.length || 0,
        activeMembers: new Set(aircraftData?.map(a => a.owner_id).filter(Boolean)).size,
        pendingMaintenance: 0,
        monthlyRevenue: 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Freedom Aviation management overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAircraft}</div>
            <p className="text-xs text-muted-foreground">Under management</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Aircraft owners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Queue</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">Items pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>All aircraft under management</CardDescription>
        </CardHeader>
        <CardContent>
          {aircraft.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No aircraft registered yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tail Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aircraft.map((ac) => (
                  <TableRow key={ac.id}>
                    <TableCell className="font-medium">{ac.tail_number}</TableCell>
                    <TableCell>{ac.model}</TableCell>
                    <TableCell>
                      {ac.profiles?.full_name || ac.profiles?.email || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ac.status === 'active' ? 'default' : 'secondary'}>
                        {ac.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" className="justify-start">
            <Plane className="h-4 w-4 mr-2" />
            Add Aircraft
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
          <Button variant="outline" className="justify-start">
            <Wrench className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
