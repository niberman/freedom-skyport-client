import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceTask } from "../types";

interface ServiceTimelineProps {
  tasks: ServiceTask[];
  isLoading: boolean;
}

export function ServiceTimeline({ tasks, isLoading }: ServiceTimelineProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Timeline</CardTitle>
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
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No service history yet
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">
                      {task.type.replace(/_/g, " ")}
                    </p>
                    <Badge variant={getStatusVariant(task.status) as any}>
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {task.notes && (
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(task.created_at)}</span>
                    {task.completed_at && (
                      <span>• Completed {formatDate(task.completed_at)}</span>
                    )}
                  </div>
                  {task.photos && task.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {task.photos.slice(0, 3).map((photo, idx) => (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
