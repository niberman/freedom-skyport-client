import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getServices, createService, getAircraft, getAllServices, updateServiceStatus, Service } from '@/lib/supabase-api';
import { format } from 'date-fns';
import { Wrench, CheckCircle, Clock, XCircle } from 'lucide-react';

const Services = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    aircraft_id: '',
    type: 'detail' as 'detail' | 'tks' | 'o2' | 'oil' | 'staging' | 'cleaning',
    notes: '',
    scheduled_at: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, aircraftData] = await Promise.all([
        isAdmin ? getAllServices() : getServices(user!.id),
        getAircraft(user!.id),
      ]);
      setServices(servicesData as Service[]);
      setAircraft(aircraftData);
    } catch (error: any) {
      toast({
        title: 'Error loading services',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createService({
        aircraft_id: formData.aircraft_id,
        type: formData.type,
        notes: formData.notes || undefined,
        scheduled_at: formData.scheduled_at || undefined,
      });

      toast({
        title: 'Service requested',
        description: 'Your service request has been submitted successfully.',
      });

      setShowForm(false);
      setFormData({
        aircraft_id: '',
        type: 'detail',
        notes: '',
        scheduled_at: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (serviceId: string, newStatus: Service['status']) => {
    try {
      await updateServiceStatus(serviceId, newStatus, 
        newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}
      );
      toast({
        title: 'Status updated',
        description: 'Service status has been updated successfully.',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Service['status']) => {
    const variants: Record<Service['status'], { variant: any; icon: any }> = {
      requested: { variant: 'secondary', icon: Clock },
      scheduled: { variant: 'default', icon: Clock },
      in_progress: { variant: 'default', icon: Wrench },
      completed: { variant: 'default', icon: CheckCircle },
      canceled: { variant: 'destructive', icon: XCircle },
    };

    const { variant, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const serviceTypeLabels: Record<Service['type'], string> = {
    detail: 'Detail',
    tks: 'TKS Fluid',
    o2: 'Oxygen',
    oil: 'Oil Change',
    staging: 'Staging',
    cleaning: 'Cleaning',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Aircraft Services</h1>
            <p className="text-muted-foreground">
              Manage maintenance, detailing, and service requests
            </p>
          </div>
          
          {!isAdmin && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Request Service'}
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Request Service</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aircraft">Aircraft</Label>
                  <Select
                    value={formData.aircraft_id}
                    onValueChange={(value) => setFormData({ ...formData, aircraft_id: value })}
                    required
                  >
                    <SelectTrigger id="aircraft">
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraft.map((ac) => (
                        <SelectItem key={ac.id} value={ac.id}>
                          {ac.tail_number} - {ac.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Service Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Preferred Date (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details or special instructions..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No service requests found</p>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id}>
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {service.aircraft?.tail_number} - {serviceTypeLabels[service.type]}
                        </h3>
                        {getStatusBadge(service.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {service.aircraft?.model}
                      </p>
                      
                      {service.notes && (
                        <p className="text-sm mb-2">{service.notes}</p>
                      )}
                      
                      {service.scheduled_at && (
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {format(new Date(service.scheduled_at), 'PPp')}
                        </p>
                      )}
                      
                      {service.completed_at && (
                        <p className="text-sm text-muted-foreground">
                          Completed: {format(new Date(service.completed_at), 'PPp')}
                        </p>
                      )}
                    </div>
                    
                    {isAdmin && service.status !== 'completed' && service.status !== 'canceled' && (
                      <div className="flex gap-2">
                        {service.status === 'requested' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(service.id, 'scheduled')}
                          >
                            Schedule
                          </Button>
                        )}
                        {service.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(service.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        {service.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(service.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(service.id, 'canceled')}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Services;
