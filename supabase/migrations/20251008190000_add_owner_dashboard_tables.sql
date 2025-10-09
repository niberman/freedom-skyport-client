-- Migration: Add tables for OwnerDashboard features

-- 1. reservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  aircraft_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  destination text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. maintenance_due
CREATE TABLE IF NOT EXISTS maintenance_due (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  item text NOT NULL,
  due_at_hours numeric,
  due_at_date date,
  remaining_hours numeric,
  remaining_days integer,
  severity text
);

-- 3. aircraft_consumables
CREATE TABLE IF NOT EXISTS aircraft_consumables (
  aircraft_id uuid PRIMARY KEY,
  oil_qts numeric,
  o2_pct numeric,
  tks_pct numeric,
  last_updated timestamptz
);

-- 4. pilot_currency
CREATE TABLE IF NOT EXISTS pilot_currency (
  owner_id uuid PRIMARY KEY,
  fr_due date,
  ipc_due date,
  medical_due date,
  ifr_6in6_status text,
  night_to_landing_due date
);

-- 5. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  body text,
  level text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. insurance_policies
CREATE TABLE IF NOT EXISTS insurance_policies (
  aircraft_id uuid PRIMARY KEY,
  carrier text,
  policy_number text,
  limits text,
  expires_on date,
  status text
);

-- 7. payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean
);

-- 8. support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  subject text NOT NULL,
  body text,
  status text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 9. documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  aircraft_id uuid,
  label text NOT NULL,
  status text,
  created_at timestamptz DEFAULT now()
);
