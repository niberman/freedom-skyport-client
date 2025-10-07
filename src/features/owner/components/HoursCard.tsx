import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
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
  return;
}