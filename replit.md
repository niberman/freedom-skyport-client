# Freedom Aviation Platform - Replit Migration

## Project Overview
Comprehensive aircraft/aviation management platform migrated from Lovable (Supabase-based) to Replit environment. The system manages aircraft service requests, membership tiers with activity-based credits, multi-airport operations, invoicing, and provides administrative tools for aviation service providers.

## Recent Changes (October 11, 2025)

### Server Startup Fixes
- Fixed Express 5.x route pattern compatibility:
  - Changed catch-all routes from `"/*"` to `"*splat"` in server/vite.ts (lines 32 and 63)
  - Express 5.x requires named wildcards for path-to-regexp compatibility
- Fixed authentication initialization:
  - Made server/replitAuth.ts conditionally handle missing environment variables
  - Development mode: allows server to start without auth (with warnings)
  - Production mode: throws error if auth env vars are missing (fail-safe)
  - Security: prevents auth bypass in production while allowing local development

### Migration Progress
- ✅ Database schema migrated: converted all 13 Supabase migrations to Drizzle ORM schema
- ✅ Backend infrastructure: Express server, API routes, storage layer created
- ✅ Replit Auth integration: user sessions and authentication system
- ✅ Frontend files moved from root src/ to client/src/
- ✅ Server successfully starts and binds to port 5000
- 🔄 IN PROGRESS: Replace Supabase client usage with backend API calls
- ⏳ PENDING: Update frontend authentication to use Replit Auth
- ⏳ PENDING: Full application testing

## Project Architecture

### Backend (server/)
- **index.ts**: Express app setup with logging middleware
- **routes.ts**: API routes for all entities (aircraft, services, requests, invoices, etc.)
- **storage.ts**: Database operations using Drizzle ORM
- **replitAuth.ts**: Replit Auth integration with Passport.js
- **vite.ts**: Vite dev server integration (development) and static file serving (production)

### Frontend (client/src/)
- **React + TypeScript** with Vite bundler
- **shadcn/ui** components with Tailwind CSS
- **TanStack Query** for data fetching
- **wouter** for client-side routing
- **Features**:
  - Owner Dashboard with aircraft management
  - Service request system with Pre-Flight Concierge options
  - Credit-based membership tiers (activity-based on flight hours)
  - Invoice management
  - Multi-role support (owner, admin, instructor)

### Database Schema (shared/schema.ts)
Main entities:
- **users**: Replit Auth users
- **profiles**: Extended user profiles
- **user_roles**: Role assignments (owner, admin)
- **aircraft**: Aircraft records with hobbs/tach times
- **service_requests**: Service requests with concierge features
- **services**: Available service catalog
- **memberships**: User membership tiers
- **membership_tiers**: Tier definitions with credit rates
- **invoices**: Billing and invoicing
- **flight_hours**: Flight time tracking for credit calculations
- **activity_logs**: Audit trail
- **sessions**: Auth session storage

## Configuration

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET`: Session encryption key (auto-provided by Replit)
- `REPLIT_DOMAINS`: Replit deployment domains (auto-provided)
- `REPL_ID`: Replit project ID (auto-provided)
- `ISSUER_URL`: Optional OIDC issuer URL (defaults to https://replit.com/oidc)

### Development
- Run: `npm run dev` (starts Express + Vite dev server on port 5000)
- Database push: `npm run db:push`
- Database studio: `npm run db:studio`

### Deployment
- Target: Autoscale (configured in .replit)
- Build: `npm run build`
- Run: TBD (needs production start script)

## Known Issues & TODOs

### Current Blockers
- Supabase client still imported in frontend files (needs replacement)
- Frontend authentication needs migration to Replit Auth
- tsx watch mode may restart unexpectedly

### Next Steps
1. Replace Supabase client imports with backend API calls
2. Update frontend auth hooks to use Replit Auth endpoints
3. Test all features end-to-end
4. Configure production deployment script

## Technical Notes

### Express 5.x Compatibility
- Catch-all routes must use named wildcards: `*splat` instead of `*` or `/*`
- path-to-regexp breaking changes require pattern updates

### Security
- Auth properly fails in production if env vars missing
- Development mode allows bypass with console warnings
- Session storage uses PostgreSQL via connect-pg-simple

### Database Migration Strategy
- Converted Supabase SQL migrations to Drizzle schema
- Using Drizzle ORM for type-safe database access
- Schema changes via `npm run db:push` (not manual migrations)

## Source Repository
Original Lovable project: https://github.com/niberman/freedom-skyport-client
