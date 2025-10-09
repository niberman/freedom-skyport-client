---
to: src/features/<%= nameParam %>/api.ts
---
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const j = (u: string, init?: RequestInit) => fetch(u, init).then(r => r.json());

export function use<%= namePascal %>Query() {
  return useQuery({
    queryKey: ["<%= nameParam %>"],
    queryFn: () => j("/api/<%= nameParam %>")
  });
}

export function use<%= namePascal %>Mutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => j("/api/<%= nameParam %>", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["<%= nameParam %>"] }),
  });
}