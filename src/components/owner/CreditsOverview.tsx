import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTierName, getTierMultiplier } from "@/lib/creditCalculator";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function CreditsOverview() {
  const { user } = useAuth();

  const { data: membership } = useQuery({
    queryKey: ["membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          *,
          membership_tiers (
            name,
            credit_multiplier,
            min_hours_per_month,
            max_hours_per_month
          )
        `)
        .eq("owner_id", user.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: monthlyHours } = useQuery({
    queryKey: ["monthly-hours", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      
      const { data, error } = await supabase
        .from("flight_hours")
        .select("hours_flown")
        .eq("owner_id", user.id)
        .gte("flight_date", format(start, "yyyy-MM-dd"))
        .lte("flight_date", format(end, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data.reduce((sum, entry) => sum + (entry.hours_flown || 0), 0);
    },
    enabled: !!user,
  });

  const { data: credits } = useQuery({
    queryKey: ["service-credits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_credits")
        .select(`
          *,
          services (
            name,
            category,
            can_rollover,
            credits_per_period,
            base_credits_low_activity,
            base_credits_high_activity
          )
        `)
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentTier = getTierName(monthlyHours || 0);
  const multiplier = getTierMultiplier(monthlyHours || 0);

  if (!membership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Credits</CardTitle>
          <CardDescription>No active membership</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact admin to set up your membership and service credits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Credits</CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <span>Membership Tier:</span>
            <Badge variant="secondary">{currentTier}</Badge>
            <span className="text-xs">
              (×{multiplier} multiplier)
            </span>
          </div>
          <div className="text-xs mt-1">
            Monthly hours: {monthlyHours?.toFixed(1) || "0.0"} hrs
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credits && credits.length > 0 ? (
          <div className="space-y-4">
            {credits.map((credit: any) => {
              const isHighActivity = (monthlyHours || 0) >= 10;
              const baseCredits = isHighActivity
                ? credit.services?.base_credits_high_activity
                : credit.services?.base_credits_low_activity;
              const calculatedCredits = Math.floor((baseCredits || 0) * multiplier);

              return (
                <div
                  key={credit.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{credit.services?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {credit.services?.category}
                      {credit.services?.can_rollover && " • Rollover enabled"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base: {baseCredits} × {multiplier} = {calculatedCredits} credits/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {credit.credits_available}/{calculatedCredits}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No service credits configured yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
