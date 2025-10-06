import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAircraft, getReservations, getServices, getTrainingCurrency, TrainingCurrency } from '@/lib/supabase-api';
import { format } from 'date-fns';
import { Plane, Calendar, Wrench, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Aircraft {
  id: string;
  tail_number: string;
  model: string;
  base_location: string;
  status: string;
}

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [trainingCurrency, setTrainingCurrency] = useState<TrainingCurrency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [aircraftData, reservationsData, servicesData, currencyData] = await Promise.all([
        getAircraft(user!.id),
        getReservations(user!.id),
        getServices(user!.id),
        getTrainingCurrency(user!.id),
      ]);
      setAircraft(aircraftData);
      setReservations(reservationsData.filter(r => new Date(r.start_at) > new Date()));
      setServices(servicesData.filter(s => s.status !== 'completed' && s.status !== 'canceled'));
      setTrainingCurrency(currencyData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrainingBadge = () => {
    if (!trainingCurrency) return null;
    
    const hasExpired = !trainingCurrency.ipc_current || !trainingCurrency.bfr_current;
    const isDueSoon = trainingCurrency.ipc_due_soon || trainingCurrency.bfr_due_soon;
    
    if (hasExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    
    if (isDueSoon) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Due Soon
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Current
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Manage your aircraft and view upcoming activities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Flights</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getTrainingBadge()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Aircraft</CardTitle>
        </CardHeader>
        <CardContent>
          {aircraft.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No aircraft found. Contact admin to add your aircraft.
            </p>
          ) : (
            <div className="space-y-4">
              {aircraft.map((ac) => (
                <div key={ac.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{ac.tail_number}</h3>
                    <p className="text-sm text-muted-foreground">{ac.model}</p>
                    <p className="text-xs text-muted-foreground mt-1">Base: {ac.base_location}</p>
                  </div>
                  <Badge>{ac.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
