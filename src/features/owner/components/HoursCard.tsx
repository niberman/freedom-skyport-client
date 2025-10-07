import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from “@/components/ui/card”;
import { Progress } from “@/components/ui/progress”;

type Props = {
mtdHours: number;
};

function tierFor(hours: number) {
if (hours < 10) return { name: “Tier 1”, range: “0–10”, min: 0, max: 10 };
if (hours < 25) return { name: “Tier 2”, range: “10–25”, min: 10, max: 25 };
if (hours < 40) return { name: “Tier 3”, range: “25–40”, min: 25, max: 40 };
return { name: “Tier 4”, range: “40+”, min: 40, max: 60 }; // cap bar at 60 for visualization
}

export function HoursCard({ mtdHours }: Props) {
const tier = tierFor(mtdHours);
const span = Math.max(1, tier.max - tier.min);
const progress = Math.min(100, Math.max(0, ((mtdHours - tier.min) / span) * 100));

return (


Hours This Month


{mtdHours.toFixed(1)} hrs

{tier.name} ({tier.range})



Tier rules auto-schedule services and consumables.



);
}

interface HoursCardProps {
  mtdHours: number;
}
export function HoursCard({
  mtdHours
}: HoursCardProps) {
  // Tier thresholds
  const tiers = [{
    name: "Light Flyer",
    min: 0,
    max: 10,
    color: "text-blue-500"
  }, {
    name: "Regular Flyer",
    min: 10,
    max: 25,
    color: "text-green-500"
  }, {
    name: "Frequent Flyer",
    min: 25,
    max: 40,
    color: "text-orange-500"
  }, {
    name: "Professional",
    min: 40,
    max: 100,
    color: "text-purple-500"
  }];

  // Find current tier
  const currentTier = tiers.find(tier => mtdHours >= tier.min && mtdHours < tier.max) || tiers[tiers.length - 1];
  const nextTier = tiers.find(tier => tier.min > mtdHours);
  const progress = nextTier ? (mtdHours - currentTier.min) / (nextTier.min - currentTier.min) * 100 : 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Flight Hours</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold">{mtdHours.toFixed(1)} hrs</span>
            <span className="text-sm text-muted-foreground">MTD</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={currentTier.color + " font-medium"}>{currentTier.name}</span>
            <span className="text-muted-foreground">
              ({currentTier.min}–{currentTier.max} hrs)
            </span>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to {nextTier.name}</span>
              <span>{(nextTier.min - mtdHours).toFixed(1)} hrs remaining</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Tier rules auto-schedule services based on monthly flight activity
        </p>
      </CardContent>
    </Card>
  );
}