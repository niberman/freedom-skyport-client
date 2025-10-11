import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseStub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
}

export function ServicesManagement() {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "maintenance",
    credits_required: 1,
    can_rollover: false,
    credits_per_period: 1,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("services").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      resetForm();
      toast({ title: "Service created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Service>;
    }) => {
      const { error } = await supabase.from("services").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      setEditingService(null);
      resetForm();
      toast({ title: "Service updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Service deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ 
      name: "", 
      description: "", 
      category: "maintenance",
      credits_required: 1,
      can_rollover: false,
      credits_per_period: 1,
    });
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      credits_required: service.credits_required || 1,
      can_rollover: service.can_rollover || false,
      credits_per_period: service.credits_per_period || 1,
    });
    setOpen(true);
  };

  const toggleActive = (service: Service) => {
    updateMutation.mutate({
      id: service.id,
      data: { is_active: !service.is_active },
    });
  };

  const categoryLabels: Record<string, string> = {
    maintenance: "Maintenance",
    detailing: "Detailing",
    readiness: "Readiness",
    training: "Training",
    concierge: "Concierge",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Service Options</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="detailing">Detailing</SelectItem>
                    <SelectItem value="readiness">Readiness</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="concierge">Concierge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits_required">Credits Required</Label>
                  <Input
                    id="credits_required"
                    type="number"
                    min="0"
                    value={formData.credits_required}
                    onChange={(e) =>
                      setFormData({ ...formData, credits_required: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits_per_period">Credits Per Month</Label>
                  <Input
                    id="credits_per_period"
                    type="number"
                    min="0"
                    value={formData.credits_per_period}
                    onChange={(e) =>
                      setFormData({ ...formData, credits_per_period: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="can_rollover"
                  checked={formData.can_rollover}
                  onChange={(e) =>
                    setFormData({ ...formData, can_rollover: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="can_rollover" className="cursor-pointer">
                  Credits can roll over to next month
                </Label>
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
                <Button type="submit">
                  {editingService ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading services...
          </div>
        ) : services && services.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Rollover</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service: any) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{categoryLabels[service.category]}</TableCell>
                  <TableCell className="text-sm">
                    {service.credits_required || 0} / {service.credits_per_period || 0} per month
                  </TableCell>
                  <TableCell>
                    {service.can_rollover ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {service.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleActive(service)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No services configured yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
