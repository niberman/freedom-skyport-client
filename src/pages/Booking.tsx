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
import {
  getReservations,
  getAllReservations,
  createReservation,
  updateReservationStatus,
  getAircraft,
  getAllAircraft,
  getInstructors,
  Reservation,
} from '@/lib/supabase-api';
import { format } from 'date-fns';
import { Calendar, Plane, User, Clock } from 'lucide-react';

const Booking = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    aircraft_id: '',
    instructor_id: '',
    start_at: '',
    end_at: '',
    purpose: 'Personal',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsData, aircraftData, instructorsData] = await Promise.all([
        isAdmin ? getAllReservations() : getReservations(user!.id),
        isAdmin ? getAllAircraft() : getAircraft(user!.id),
        getInstructors(),
      ]);
      setReservations(reservationsData as Reservation[]);
      setAircraft(aircraftData);
      setInstructors(instructorsData);
    } catch (error: any) {
      toast({
        title: 'Error loading bookings',
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
      await createReservation({
        aircraft_id: formData.aircraft_id,
        instructor_id: formData.instructor_id || undefined,
        start_at: formData.start_at,
        end_at: formData.end_at,
        purpose: formData.purpose,
        notes: formData.notes || undefined,
      });

      toast({
        title: 'Booking created',
        description: 'Your flight booking has been submitted successfully.',
      });

      setShowForm(false);
      setFormData({
        aircraft_id: '',
        instructor_id: '',
        start_at: '',
        end_at: '',
        purpose: 'Personal',
        notes: '',
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

  const handleStatusUpdate = async (
    id: string,
    status: 'confirmed' | 'canceled'
  ) => {
    try {
      await updateReservationStatus(id, status);
      toast({
        title: 'Booking updated',
        description: `Booking has been ${status}.`,
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

  const getStatusBadge = (status: Reservation['status']) => {
    const variants: Record<
      Reservation['status'],
      { variant: any; label: string }
    > = {
      requested: { variant: 'secondary', label: 'Requested' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      completed: { variant: 'outline', label: 'Completed' },
      canceled: { variant: 'destructive', label: 'Canceled' },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const upcomingReservations = reservations.filter(
    (r) =>
      new Date(r.start_at) > new Date() &&
      (r.status === 'confirmed' || r.status === 'requested')
  );
  const pastReservations = reservations.filter(
    (r) =>
      new Date(r.start_at) <= new Date() ||
      r.status === 'completed' ||
      r.status === 'canceled'
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {isAdmin ? 'Flight Schedule' : 'My Bookings'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Manage all flight reservations'
                : 'Book and manage your flights'}
            </p>
          </div>

          {!isAdmin && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'New Booking'}
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Book a Flight</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aircraft">Aircraft *</Label>
                    <Select
                      value={formData.aircraft_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, aircraft_id: value })
                      }
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
                    <Label htmlFor="instructor">Instructor (Optional)</Label>
                    <Select
                      value={formData.instructor_id || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, instructor_id: value })
                      }
                    >
                      <SelectTrigger id="instructor">
                        <SelectValue placeholder="No instructor (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.profiles?.full_name || inst.profiles?.email}
                            {inst.ratings?.length > 0 &&
                              ` (${inst.ratings.join(', ')})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_at">Start Time *</Label>
                    <Input
                      id="start_at"
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) =>
                        setFormData({ ...formData, start_at: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_at">End Time *</Label>
                    <Input
                      id="end_at"
                      type="datetime-local"
                      value={formData.end_at}
                      onChange={(e) =>
                        setFormData({ ...formData, end_at: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value) =>
                      setFormData({ ...formData, purpose: value })
                    }
                  >
                    <SelectTrigger id="purpose">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="IPC">IPC</SelectItem>
                      <SelectItem value="BFR">BFR</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Book Flight
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {upcomingReservations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingReservations.map((reservation) => (
                  <Card key={reservation.id}>
                    <CardContent className="py-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Plane className="h-5 w-5" />
                              {reservation.aircraft?.tail_number} -{' '}
                              {reservation.aircraft?.model}
                            </h3>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {format(new Date(reservation.start_at), 'PPpp')} -{' '}
                              {format(new Date(reservation.end_at), 'p')}
                            </p>

                            {reservation.instructor && (
                              <p className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Instructor:{' '}
                                {reservation.instructor.profiles?.full_name ||
                                  reservation.instructor.profiles?.email}
                              </p>
                            )}

                            <p>Purpose: {reservation.purpose}</p>

                            {reservation.notes && (
                              <p className="mt-2">{reservation.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isAdmin && reservation.status === 'requested' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(reservation.id, 'confirmed')
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {(isAdmin ||
                            reservation.status === 'requested') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusUpdate(reservation.id, 'canceled')
                              }
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastReservations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Past</h2>
              <div className="space-y-4">
                {pastReservations.map((reservation) => (
                  <Card key={reservation.id} className="opacity-75">
                    <CardContent className="py-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {reservation.aircraft?.tail_number} -{' '}
                              {reservation.aircraft?.model}
                            </h3>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              {format(new Date(reservation.start_at), 'PPpp')}
                            </p>
                            <p>Purpose: {reservation.purpose}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {reservations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No bookings found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Booking;
