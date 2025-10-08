Copilot Project Instructions — Freedom Skyport Client

Purpose: Minimal domain + architecture context so AI changes align with current patterns (not aspirational ones).

Architecture & Domains
• Stack: React + Vite + TypeScript, Tailwind, shadcn/ui (Radix). Data + auth + RBAC via Supabase (PostgREST + RLS). No custom backend layer.
• Key tables (see `src/integrations/supabase/types.ts`): aircraft, memberships & membership_tiers, services, service_requests, service_tasks, invoices (+ invoice_lines), service_credits, user_roles, profiles, activity_logs.
• Business logic kept client‑side & minimal; credit math centralized (never duplicate) in `src/lib/creditCalculator.ts`.

Auth / Roles / Routing
• Auth provider: `useAuth` (user, session, signIn, signUp, signOut) wrapped by `<AuthProvider>` in `App.tsx`.
• Roles: DB enum (owner, admin) + UI-only extension instructor. Resolution logic (admin > instructor > owner) in `useUserRole` with key `["user-role", userId]`.
• Protect views with `<ProtectedRoute allowedRoles={["admin"]}>` or no `allowedRoles` for “signed-in only”. Unauthorized -> `/unauthorized`, unauthenticated -> `/auth`.
• Dashboards: `pages/Dashboard.tsx` switches on resolved role; extend there when adding a new role or dashboard variant.

Data Access Patterns (React Query v5)
• Import client from `@/integrations/supabase/client`; env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (do NOT hardcode keys).
• Typing example: `import type { Database } from "@/integrations/supabase/types"; type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];`
• Query key conventions: `["aircraft"]`, `["aircraft", id]`; `["service-requests", { aircraftId }]`; `["invoices", { ownerId, period }]`. Reuse exact shapes for invalidation.
• Prefer explicit column selection: `.select("id, status, updated_at")` instead of `*` when adding new queries.
• Mutation pattern: perform insert/update/delete → throw on `error` → `queryClient.invalidateQueries({ queryKey: ["domain-key"] })` (only the keys you actually used).

Service Requests & Credits
• Service request status values observed: `pending | in_progress | completed | cancelled`; priority: `low | medium | high` (keep enum strings consistent across UI & DB migrations).
• Credit & tier calculations: extend ONLY in `creditCalculator.ts` (functions are pure: `calculateMonthlyCredits`, `getTierMultiplier`).

Migrations & Types
• Add schema changes via new SQL file in `supabase/migrations/` (timestamp prefix). Then regenerate types:
  `supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/integrations/supabase/types.ts`
• Never hand edit generated sections; add helpers separately if needed.

UI & Components
• Reuse shadcn primitives in `src/components/ui/*`; prefer variant props over custom Tailwind chains when similar style exists.
• Keep cross-cutting logic in hooks (`src/hooks/*`). Role / auth logic MUST NOT be duplicated inside feature components.

Gotchas / Safety
• “Missing” rows usually = RLS denial, not null data; confirm policies before code changes.
• Keep query keys stable; mismatched shapes cause silent stale views.
• Don’t scatter numeric credit multipliers; derive via helpers.
• Avoid optimistic updates unless trivial; rely on invalidation for consistency.

Feature Recipe (summary)
1. Migration + types regen.
2. New query hook with stable key.
3. UI component (role‑gated if needed) + route registration in `App.tsx` or dashboard switch.
4. Mutation(s) with targeted invalidations.

End.