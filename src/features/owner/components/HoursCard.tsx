import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface HoursCardProps {
  mtdHours: number;
}

export function HoursCard({ mtdHours }: HoursCardProps) {
  // Tier thresholds
  const tiers = [
    { name: "Light Flyer", min: 0, max: 10, color: "text-blue-500" },
    { name: "Regular Flyer", min: 10, max: 25, color: "text-green-500" },
    { name: "Frequent Flyer", min: 25, max: 40, color: "text-orange-500" },
    { name: "Professional", min: 40, max: 100, color: "text-purple-500" },
  ];

  // Find current tier
  const currentTier = tiers.find(
    (tier) => mtdHours >= tier.min && mtdHours < tier.max
  ) || tiers[tiers.length - 1];

  const nextTier = tiers.find((tier) => tier.min > mtdHours);
  
  const progress = nextTier
    ? ((mtdHours - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Flight Hours (MTD)</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold">{mtdHours.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className={currentTier.color}>{currentTier.name}</span>
              {nextTier && ` • ${(nextTier.min - mtdHours).toFixed(1)} hours to ${nextTier.name}`}
            </p>
          </div>
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentTier.min}h</span>
              {nextTier && <span>{nextTier.min}h</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
