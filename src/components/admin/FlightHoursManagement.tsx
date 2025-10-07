import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function FlightHoursManagement() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    owner_id: "",
    aircraft_id: "",
    flight_date: format(new Date(), "yyyy-MM-dd"),
    hours_flown: "",
    departure_airport: "",
    arrival_airport: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: owners } = useQuery({
    queryKey: ["profiles-with-aircraft"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const { data: aircraft } = useQuery({
    queryKey: ["all-aircraft"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number, owner_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: flightHours } = useQuery({
    queryKey: ["flight-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flight_hours")
        .select(`
          *,
          aircraft (tail_number),
          profiles (full_name)
        `)
        .order("flight_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("flight_hours").insert({
        owner_id: data.owner_id,
        aircraft_id: data.aircraft_id,
        flight_date: data.flight_date,
        hours_flown: parseFloat(data.hours_flown),
        departure_airport: data.departure_airport || null,
        arrival_airport: data.arrival_airport || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight-hours"] });
      setOpen(false);
      resetForm();
      toast({ title: "Flight hours logged successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error logging flight hours",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      owner_id: "",
      aircraft_id: "",
      flight_date: format(new Date(), "yyyy-MM-dd"),
      hours_flown: "",
      departure_airport: "",
      arrival_airport: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredAircraft = formData.owner_id
    ? aircraft?.filter((a) => a.owner_id === formData.owner_id)
    : aircraft;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Flight Hours Management</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Log Flight Hours
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Flight Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner_id">Owner</Label>
                <Select
                  value={formData.owner_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, owner_id: value, aircraft_id: "" })
                  }
                  required
                >
                  <SelectTrigger id="owner_id">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners?.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.full_name || owner.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aircraft_id">Aircraft</Label>
                <Select
                  value={formData.aircraft_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aircraft_id: value })
                  }
                  required
                  disabled={!formData.owner_id}
                >
                  <SelectTrigger id="aircraft_id">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAircraft?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tail_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight_date">Flight Date</Label>
                  <Input
                    id="flight_date"
                    type="date"
                    value={formData.flight_date}
                    onChange={(e) =>
                      setFormData({ ...formData, flight_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_flown">Hours Flown</Label>
                  <Input
                    id="hours_flown"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.hours_flown}
                    onChange={(e) =>
                      setFormData({ ...formData, hours_flown: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_airport">Departure</Label>
                  <Input
                    id="departure_airport"
                    value={formData.departure_airport}
                    onChange={(e) =>
                      setFormData({ ...formData, departure_airport: e.target.value })
                    }
                    placeholder="KAPA"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_airport">Arrival</Label>
                  <Input
                    id="arrival_airport"
                    value={formData.arrival_airport}
                    onChange={(e) =>
                      setFormData({ ...formData, arrival_airport: e.target.value })
                    }
                    placeholder="KBJC"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Log Hours</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {flightHours && flightHours.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flightHours.map((flight: any) => (
                <TableRow key={flight.id}>
                  <TableCell>
                    {format(new Date(flight.flight_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{flight.profiles?.full_name || "—"}</TableCell>
                  <TableCell>{flight.aircraft?.tail_number || "—"}</TableCell>
                  <TableCell>{flight.hours_flown}</TableCell>
                  <TableCell>
                    {flight.departure_airport && flight.arrival_airport
                      ? `${flight.departure_airport} → ${flight.arrival_airport}`
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {flight.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No flight hours logged yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
