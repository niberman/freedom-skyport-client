import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllAircraft, getAllReservations, getAllServices } from '@/lib/supabase-api';
import { Plane, Calendar, Wrench, Users } from 'lucide-react';

const AdminDashboard = () => {
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [aircraftData, reservationsData, servicesData] = await Promise.all([
        getAllAircraft(),
        getAllReservations(),
        getAllServices(),
      ]);

      setAircraft(aircraftData);
      setReservations(reservationsData);
      setServices(servicesData);
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

  const pendingReservations = reservations.filter(r => r.status === 'requested');
  const upcomingReservations = reservations.filter(
    r => new Date(r.start_at) > new Date() && r.status === 'confirmed'
  );
  const activeServices = services.filter(
    s => s.status !== 'completed' && s.status !== 'canceled'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all aircraft, members, and operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.length}</div>
            <p className="text-xs text-muted-foreground">
              {aircraft.filter(a => a.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingReservations.length} confirmed upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Queue</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices.length}</div>
            <p className="text-xs text-muted-foreground">
              {services.filter(s => s.status === 'in_progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(aircraft.map(a => a.owner_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Aircraft owners</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Reservation Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending requests
              </p>
            ) : (
              <div className="space-y-3">
                {pendingReservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{reservation.aircraft?.tail_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.creator?.full_name || reservation.creator?.email}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reservation.start_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {activeServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active services
              </p>
            ) : (
              <div className="space-y-3">
                {activeServices.slice(0, 5).map((service) => (
                  <div key={service.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{service.aircraft?.tail_number}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {service.type.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant="secondary">{service.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fleet Overview</CardTitle>
            <Button variant="outline" size="sm">Manage Fleet</Button>
          </div>
        </CardHeader>
        <CardContent>
          {aircraft.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No aircraft in the system
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tail Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aircraft.map((ac) => (
                  <TableRow key={ac.id}>
                    <TableCell className="font-medium">{ac.tail_number}</TableCell>
                    <TableCell>{ac.model}</TableCell>
                    <TableCell>
                      {ac.owner?.full_name || ac.owner?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>{ac.base_location}</TableCell>
                    <TableCell>
                      <Badge variant={ac.status === 'active' ? 'default' : 'secondary'}>
                        {ac.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <Button className="w-full">Add Aircraft</Button>
            <Button className="w-full" variant="outline">
              Add Member
            </Button>
            <Button className="w-full" variant="outline">
              View Reports
            </Button>
            <Button className="w-full" variant="outline">
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
