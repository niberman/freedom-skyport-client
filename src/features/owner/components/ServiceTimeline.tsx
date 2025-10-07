import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ServiceTask } from "../types";

interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  description: string;
  airport?: string;
  requested_departure?: string;
  created_at: string;
  fuel_grade?: string;
  fuel_quantity?: number;
}

interface ServiceTimelineProps {
  tasks: ServiceTask[];
  requests: ServiceRequest[];
  isLoading: boolean;
}

export function ServiceTimeline({ tasks, requests, isLoading }: ServiceTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  const formatServiceType = (type: string) => {
    const typeMap: Record<string, string> = {
      "Pre-Flight Concierge": "Pre-Flight Concierge",
      "preflight": "Pre-Flight Check",
      "full_detail": "Full Detail",
      "detail": "Detail Service",
      "clean": "Cleaning",
      "oil": "Oil Change",
      "o2": "Oxygen Service",
      "tks": "TKS Fluid Service",
      "db_update": "Database Update",
      "readiness": "Readiness Check",
      "maintenance": "Maintenance",
      "inspection": "Inspection",
      "repair": "Repair",
      "other": "Other Service"
    };
    
    return typeMap[type] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in_progress":
      case "in-progress":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Combine and sort all services
  const allServices = [
    ...requests.map(req => ({
      id: req.id,
      type: 'request' as const,
      serviceType: req.service_type,
      status: req.status,
      description: req.description,
      airport: req.airport,
      requestedDeparture: req.requested_departure,
      fuelInfo: req.fuel_grade && req.fuel_quantity ? `${req.fuel_grade}: ${req.fuel_quantity} gal` : null,
      created_at: req.created_at,
      completed_at: null,
      notes: null,
      photos: []
    })),
    ...tasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      serviceType: task.type,
      status: task.status,
      description: null,
      airport: null,
      requestedDeparture: null,
      fuelInfo: null,
      created_at: task.created_at,
      completed_at: task.completed_at,
      notes: task.notes,
      photos: task.photos
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const displayedServices = showAll ? allServices : allServices.slice(0, 5);
  const hasMore = allServices.length > 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : allServices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No service history yet. Request a service to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {displayedServices.map((service) => (
              <div key={service.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {formatServiceType(service.serviceType)}
                    </p>
                    <Badge variant={getStatusVariant(service.status) as any}>
                      {service.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  )}
                  
                  {service.notes && (
                    <p className="text-sm text-muted-foreground">{service.notes}</p>
                  )}
                  
                  <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(service.created_at)}</span>
                    {service.completed_at && (
                      <span>• Completed {formatDate(service.completed_at)}</span>
                    )}
                    {service.airport && (
                      <span>• {service.airport}</span>
                    )}
                    {service.requestedDeparture && (
                      <span>
                        • Departure: {new Date(service.requestedDeparture).toLocaleDateString()} {new Date(service.requestedDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {service.fuelInfo && (
                      <span>• {service.fuelInfo}</span>
                    )}
                  </div>
                  
                  {service.photos && service.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {service.photos.slice(0, 3).map((photo, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-xs"
                        >
                          📷
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show All ({allServices.length - 5} more)
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
