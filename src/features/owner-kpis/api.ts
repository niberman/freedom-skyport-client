import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const x = (u: string) => fetch(u).then(r => r.json());

export function useOwnerKpis() {
  return useQuery({
    queryKey: ["owner-kpis"],
    queryFn: () => x("/api/owner/overview"),
    staleTime: 30_000, // 30s (makes UI snappy)
  });
}

const j = (u: string, init?: RequestInit) => fetch(u, init).then(r => r.json());

export function useFeatureNamePascalCaseOwnerKpisQuery() {
  return useQuery({
    queryKey: ["feature-name-pascal-case-owner-kpis"],
    queryFn: () => j("/api/feature-name-pascal-case-owner-kpis")
  });
}

export function useFeatureNamePascalCaseOwnerKpisMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => j("/api/feature-name-pascal-case-owner-kpis", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature-name-pascal-case-owner-kpis"] }),
  });
}