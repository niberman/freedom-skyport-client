/**
 * Credit Calculator - Scales service credits based on flight hours
 */

export interface CreditCalculation {
  baseCredits: number;
  multiplier: number;
  totalCredits: number;
  tierName: string;
}

export function calculateMonthlyCredits(
  hoursFlown: number,
  baseCreditsLow: number,
  baseCreditsHigh: number,
  tierMultiplier: number = 1.0
): CreditCalculation {
  // Determine base credits based on activity level
  // Low activity: 0-10 hours
  // High activity: 10+ hours
  const threshold = 10;
  const baseCredits = hoursFlown < threshold ? baseCreditsLow : baseCreditsHigh;
  
  // Apply tier multiplier
  const totalCredits = Math.floor(baseCredits * tierMultiplier);
  
  return {
    baseCredits,
    multiplier: tierMultiplier,
    totalCredits,
    tierName: getTierName(hoursFlown),
  };
}

export function getTierName(hoursFlown: number): string {
  if (hoursFlown < 5) return 'Light Flyer';
  if (hoursFlown < 15) return 'Regular Flyer';
  if (hoursFlown < 30) return 'Frequent Flyer';
  return 'Professional';
}

export function getTierMultiplier(hoursFlown: number): number {
  if (hoursFlown < 5) return 0.5;
  if (hoursFlown < 15) return 1.0;
  if (hoursFlown < 30) return 1.5;
  return 2.0;
}

export function calculateServiceCredits(
  monthlyHours: number,
  services: Array<{
    id: string;
    name: string;
    base_credits_low_activity: number;
    base_credits_high_activity: number;
    can_rollover: boolean;
  }>,
  tierMultiplier?: number
): Map<string, CreditCalculation> {
  const multiplier = tierMultiplier || getTierMultiplier(monthlyHours);
  const creditsMap = new Map<string, CreditCalculation>();
  
  services.forEach(service => {
    const calculation = calculateMonthlyCredits(
      monthlyHours,
      service.base_credits_low_activity || 0,
      service.base_credits_high_activity || 0,
      multiplier
    );
    creditsMap.set(service.id, calculation);
  });
  
  return creditsMap;
}
