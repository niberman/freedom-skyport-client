import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import type { Aircraft, ServiceTask, Membership } from "../types";

interface AircraftHeaderProps {
  aircraft: Aircraft;
  membership: Membership | null;
  serviceTasks: ServiceTask[];
}

export function AircraftHeader({ aircraft, membership, serviceTasks }: AircraftHeaderProps) {
  // Determine readiness based on open tasks
  const readinessTypes = [
    "readiness",
    "clean",
    "detail",
    "oil",
    "o2",
    "tks",
    "db_update",
  ];
  
  const hasOpenTask = serviceTasks.some(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      readinessTypes.some((type) => task.type.toLowerCase().includes(type))
  );

  const readinessStatus = hasOpenTask ? "Needs Service" : "Ready";
  const readinessVariant = hasOpenTask ? "destructive" : "default";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">{aircraft.tail_number}</h1>
                <p className="text-muted-foreground">
                  {aircraft.make} {aircraft.model}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">
                Base: {aircraft.base_location || "Not Set"}
              </Badge>
              {membership && (
                <Badge variant="secondary">
                  {membership.tier}
                </Badge>
              )}
              <Badge variant={readinessVariant as any}>
                {readinessStatus}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
