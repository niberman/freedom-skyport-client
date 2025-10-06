import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Booking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '',
    purpose: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Booking Request Submitted",
      description: "We'll review your request and confirm shortly.",
    });

    setFormData({
      date: '',
      time: '',
      duration: '',
      purpose: '',
      notes: '',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Flight Booking</h1>
            <p className="text-muted-foreground">Schedule your flight or training session</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Booking Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>New Booking Request</CardTitle>
                <CardDescription>
                  Fill out the form below to request a flight reservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="2.0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="e.g., Personal flight, IPC training, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special requirements or notes..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Booking Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Upcoming Flights Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming flights</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No flight history</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <Plane className="h-4 w-4 text-primary mt-0.5" />
                    <p>Bookings are subject to aircraft availability</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <p>Please book at least 24 hours in advance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;
