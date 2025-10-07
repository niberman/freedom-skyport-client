# Owner Dashboard Implementation Changes

## Summary
Complete implementation of the Owner Dashboard feature with aircraft-specific views, flight hour tracking, service requests, timeline, and billing.

## Database Changes (SQL Migration)

### New Tables Created:
1. **service_tasks** - Tracks aircraft service work
   - Fields: aircraft_id, type, status, assigned_to, notes, photos (jsonb), completed_at
   - RLS: Owners can view their aircraft tasks, admins manage all

2. **invoices** - Monthly billing for aircraft owners
   - Fields: aircraft_id, owner_id, period_start, period_end, total_cents, status, hosted_invoice_url
   - RLS: Owners can view their invoices, admins manage all

3. **invoice_lines** - Line items for invoices
   - Fields: invoice_id, description, quantity, unit_cents
   - RLS: Owners can view lines for their invoices, admins manage all

### Indexes Added:
- service_tasks: aircraft_id, status
- invoices: aircraft_id, owner_id
- invoice_lines: invoice_id

## Files Added

### Type Definitions
- `src/features/owner/types.ts` - TypeScript interfaces for Aircraft, ServiceTask, Invoice, InvoiceLine, FlightHour, Membership

### Data Layer
- `src/features/owner/hooks/useOwnerAircraft.ts` - Custom hook aggregating all aircraft-related queries (aircraft details, MTD hours, service tasks, invoices, membership)

### Components
- `src/features/owner/components/AircraftHeader.tsx` - Displays tail number, make/model, base, membership tier, and readiness status
- `src/features/owner/components/HoursCard.tsx` - Shows month-to-date hours with progress bar to next tier
- `src/features/owner/components/QuickActions.tsx` - Modals for logging flight hours and requesting service
- `src/features/owner/components/ServiceTimeline.tsx` - Read-only list of service tasks with status chips
- `src/features/owner/components/BillingCard.tsx` - Current invoice with Pay button + history of recent invoices
- `src/features/owner/components/DocsCard.tsx` - Placeholder for future document storage

### Pages
- `src/pages/owner/OwnerDashboard.tsx` - Main route component at `/owner/:aircraftId`

## Files Modified
- `src/App.tsx` - Added route for `/owner/:aircraftId`

## Features Implemented

### 1. Aircraft Header
- Tail number, make/model display
- Base airport badge
- Membership tier badge (if active)
- Readiness pill: "Ready" or "Needs Service" based on open service tasks

### 2. Flight Hours Tracking
- MTD hours with dynamic tier display (Light/Regular/Frequent/Professional)
- Progress bar showing distance to next tier
- Thresholds: 0-10, 10-25, 25-40, 40+ hours

### 3. Quick Actions
- **Log Flight Hours**: date, hours, departure/arrival airports, notes
- **Request Service**: type (preflight, detail, oil, o2, tks, etc.), optional requested time, notes
- Both use optimistic UI with toast notifications

### 4. Service Timeline
- Newest-first list of service_tasks for the aircraft
- Status chips: pending, in_progress, completed, cancelled
- Shows creation date, completion date, notes
- Thumbnail placeholder for photos

### 5. Billing
- Displays current open invoice or most recent
- Shows period, total, status badge
- "Pay Invoice" button opens hosted_invoice_url (external link)
- History of last 6 invoices

### 6. Documents
- Placeholder card for future storage integration
- Will contain insurance, W&B, maintenance logs

## Data Access & Security
- All queries respect RLS policies
- Owners can only view/modify their own aircraft data
- No service role key required
- Authentication required via existing auth system

## UX Details
- Optimistic UI on data mutations
- Toast notifications for success/error states
- Empty states with friendly messaging
- Responsive grid layouts (mobile → desktop)
- Skeleton loaders during data fetch
- Auto-invalidates queries after mutations

## Type Safety
- Strict TypeScript types for all entities
- Proper null handling throughout
- Type-safe Supabase queries

## Notes
- Reuses existing Layout, auth guards, theme system
- No regressions to existing dashboard routes
- Storage/docs feature flagged as "coming soon"
- Minimal diffs to existing code
