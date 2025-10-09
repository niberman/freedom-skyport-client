import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const j = (u: string, init?: RequestInit) => fetch(u, init).then(r => r.json());

export function useTestQuery() {
  return useQuery({
    queryKey: ["test"],
    queryFn: () => j("/api/test")
  });
}

export function useTestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => j("/api/test", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test"] }),
  });
}