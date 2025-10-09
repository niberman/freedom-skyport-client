import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
}

export function UserRoleManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ProfileRow[];
    },
    staleTime: 60_000,
  });

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async (): Promise<UserRoleRow[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as UserRoleRow[];
    },
    staleTime: 30_000,
  });

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "User promoted to admin" });
    },
    onError: (err: any) => {
      toast({ title: "Promotion failed", description: err.message, variant: "destructive" });
    },
  });

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const { data: match, error } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!match) {
        toast({ title: "No profile found for email" });
        return;
      }
      // Check if already admin
      const already = roles?.some(r => r.user_id === match.id && r.role === "admin");
      if (already) {
        toast({ title: "User already an admin" });
        return;
      }
      promoteMutation.mutate(match.id);
      setEmail("");
    } finally {
      setBusy(false);
    }
  };

  const emailRoleMap: Map<string, string[]> = (() => {
    const arr: [string, string[]][] = [];
    (roles || []).forEach(r => {
      const existing = arr.find(entry => entry[0] === r.user_id);
      if (existing) existing[1].push(r.role);
      else arr.push([r.user_id, [r.role]]);
    });
    return new Map(arr);
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Roles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handlePromote} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <Label htmlFor="promote-email">Promote user to admin (by email)</Label>
            <Input
              id="promote-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || promoteMutation.isPending}>
              {promoteMutation.isPending ? "Promoting..." : "Promote"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEmail("")}>Clear</Button>
          </div>
        </form>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Recent Profiles</h4>
          {loadingProfiles ? (
            <div className="text-sm text-muted-foreground">Loading profiles...</div>
          ) : profiles && profiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const rolesForUser = [...(emailRoleMap.get(p.id) || [])];
                  const isAdmin = rolesForUser.includes("admin");
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.full_name || "—"}</TableCell>
                      <TableCell className="text-xs">{rolesForUser.join(", ") || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={isAdmin ? "outline" : "default"}
                          disabled={isAdmin || promoteMutation.isPending}
                          onClick={() => promoteMutation.mutate(p.id)}
                        >
                          {isAdmin ? "Admin" : "Make Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">No profiles found.</div>
          )}
        </div>
        {loadingRoles && <div className="text-xs text-muted-foreground">Refreshing roles…</div>}
      </CardContent>
    </Card>
  );
}
