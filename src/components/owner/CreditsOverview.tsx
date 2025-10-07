import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CreditsOverview() {
  const { user } = useAuth();

  const { data: membership } = useQuery({
    queryKey: ["membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("owner_id", user.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
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
            credits_per_period
          )
        `)
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
          Membership: <Badge variant="secondary">{membership.tier}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credits && credits.length > 0 ? (
          <div className="space-y-4">
            {credits.map((credit: any) => (
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
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {credit.credits_available}/{credit.services?.credits_per_period || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available credits
                  </p>
                </div>
              </div>
            ))}
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
