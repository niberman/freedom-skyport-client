import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Calendar, Wrench, Sparkles, FileText, Clock } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAircraft();
    }
  }, [user]);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading your aircraft...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Manage your aircraft and view upcoming flights</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Next Flight</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">No upcoming flights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Items pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Aircraft</h2>
        </div>

        {aircraft.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plane className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No aircraft registered yet.<br />Contact Freedom Aviation to add your aircraft.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {aircraft.map((ac) => (
              <Card key={ac.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{ac.tail_number}</CardTitle>
                      <CardDescription>{ac.model}</CardDescription>
                    </div>
                    <Badge variant={ac.status === 'active' ? 'default' : 'secondary'}>
                      {ac.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Plane className="h-4 w-4 mr-2" />
                    Based at {ac.base_location}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/booking')}
                      className="w-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Flight
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Maintenance
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Request Detail
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and requests</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button onClick={() => navigate('/booking')} variant="outline" className="justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Flight
          </Button>
          <Button onClick={() => navigate('/billing')} variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            View Invoices
          </Button>
          <Button variant="outline" className="justify-start">
            <Clock className="h-4 w-4 mr-2" />
            Flight History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
