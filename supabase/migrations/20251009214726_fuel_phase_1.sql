-- ========= Enums =========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fuel_type') THEN
    CREATE TYPE fuel_type AS ENUM ('AVGAS_100LL','JET_A','MOGAS','JET_A_WITH_PRIST');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fuel_status_method') THEN
    CREATE TYPE fuel_status_method AS ENUM ('manual','dipstick','sensor','calc','fuel_log');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fuel_order_target') THEN
    CREATE TYPE fuel_order_target AS ENUM ('ADD_QUANTITY','FILL_TO_TABS','FILL_TO_TABS_PLUS','FILL_TO_FULL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fuel_billing_directive') THEN
    CREATE TYPE fuel_billing_directive AS ENUM (
      'DIRECT_TO_FBO_CLIENT_CARD','FA_CARD_REBILL_CLIENT','CLIENT_INVOICE_FROM_FBO','HOLD_DONT_FUEL'
    );
  END IF;
END $$;

-- ========= Ensure fuel_logs exists (bootstrap if missing) =========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fuel_logs'
  ) THEN
    CREATE TABLE public.fuel_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
      quantity numeric(6,1) NOT NULL DEFAULT 0,
      fuel_type fuel_type,
      filled_at timestamptz NOT NULL DEFAULT now(),
      notes text,
      created_by uuid DEFAULT auth.uid()
    );
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_aircraft_id ON public.fuel_logs(aircraft_id);
  END IF;
END$$;

-- ========= Aircraft shape =========
ALTER TABLE public.aircraft
  ADD COLUMN IF NOT EXISTS fuel_type fuel_type,
  ADD COLUMN IF NOT EXISTS usable_fuel_gal numeric(6,1),
  ADD COLUMN IF NOT EXISTS tabs_fuel_gal   numeric(6,1);

UPDATE public.aircraft SET fuel_type = COALESCE(fuel_type,'AVGAS_100LL');

ALTER TABLE public.aircraft
  ALTER COLUMN fuel_type SET NOT NULL;

-- ========= Fuel logs (mirror aircraft fuel type) =========
ALTER TABLE public.fuel_logs
  ADD COLUMN IF NOT EXISTS fuel_type fuel_type,
  ADD COLUMN IF NOT EXISTS quantity numeric(6,1);

ALTER TABLE public.fuel_logs
  ALTER COLUMN quantity SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fuel_quantity_positive'
      AND conrelid = 'public.fuel_logs'::regclass
  ) THEN
    ALTER TABLE public.fuel_logs
      ADD CONSTRAINT fuel_quantity_positive CHECK (quantity > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fuel_logs_set_type()
RETURNS trigger AS $$
BEGIN
  SELECT a.fuel_type INTO NEW.fuel_type
  FROM public.aircraft a
  WHERE a.id = NEW.aircraft_id;
  IF NEW.fuel_type IS NULL THEN
    RAISE EXCEPTION 'Aircraft % has no fuel_type', NEW.aircraft_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fuel_logs_set_type ON public.fuel_logs;
CREATE TRIGGER trg_fuel_logs_set_type
BEFORE INSERT OR UPDATE OF aircraft_id ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.fuel_logs_set_type();

-- ========= Live “current fuel” snapshots (trigger-enforced cap) =========
CREATE TABLE IF NOT EXISTS public.aircraft_fuel_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  gallons_onboard numeric(6,1) NOT NULL CHECK (gallons_onboard >= 0),
  measured_at timestamptz NOT NULL DEFAULT now(),
  method fuel_status_method NOT NULL DEFAULT 'manual',
  notes text,
  recorded_by uuid DEFAULT auth.uid()
);

CREATE OR REPLACE FUNCTION public.afs_enforce_capacity()
RETURNS trigger AS $$
DECLARE
  max_usable numeric(6,1);
BEGIN
  SELECT a.usable_fuel_gal INTO max_usable
  FROM public.aircraft a
  WHERE a.id = NEW.aircraft_id;

  IF max_usable IS NOT NULL AND NEW.gallons_onboard > max_usable THEN
    RAISE EXCEPTION 'gallons_onboard (%.1f) exceeds aircraft usable fuel (%.1f) for aircraft %',
      NEW.gallons_onboard, max_usable, NEW.aircraft_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_afs_enforce_capacity ON public.aircraft_fuel_status;
CREATE TRIGGER trg_afs_enforce_capacity
BEFORE INSERT OR UPDATE ON public.aircraft_fuel_status
FOR EACH ROW EXECUTE FUNCTION public.afs_enforce_capacity();

CREATE OR REPLACE VIEW public.v_aircraft_fuel_latest AS
SELECT DISTINCT ON (afs.aircraft_id)
  afs.aircraft_id, afs.gallons_onboard, afs.measured_at, afs.method
FROM public.aircraft_fuel_status afs
JOIN public.aircraft a ON a.id = afs.aircraft_id
WHERE a.usable_fuel_gal IS NOT NULL
ORDER BY afs.aircraft_id, afs.measured_at DESC;

-- Any fueling bumps the snapshot forward
CREATE OR REPLACE FUNCTION public.after_fuel_log_update_status()
RETURNS trigger AS $$
DECLARE
  full_gal numeric(6,1);
  prev_gal numeric(6,1);
  new_gal numeric(6,1);
BEGIN
  SELECT a.usable_fuel_gal INTO full_gal FROM public.aircraft a WHERE a.id = NEW.aircraft_id;
  SELECT v.gallons_onboard INTO prev_gal FROM public.v_aircraft_fuel_latest v WHERE v.aircraft_id = NEW.aircraft_id;
  IF prev_gal IS NULL THEN prev_gal := 0; END IF;
  new_gal := LEAST(prev_gal + NEW.quantity, COALESCE(full_gal, prev_gal + NEW.quantity));
  INSERT INTO public.aircraft_fuel_status (aircraft_id, gallons_onboard, method, notes)
  VALUES (NEW.aircraft_id, new_gal, 'fuel_log', 'Auto from fueling');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_fuel_log_update_status ON public.fuel_logs;
CREATE TRIGGER trg_after_fuel_log_update_status
AFTER INSERT ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.after_fuel_log_update_status();

-- Public RPC to record a manual snapshot
CREATE OR REPLACE FUNCTION public.set_fuel_snapshot(
  p_aircraft uuid, p_gal numeric, p_method fuel_status_method DEFAULT 'manual', p_notes text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.aircraft_fuel_status(aircraft_id, gallons_onboard, method, notes)
  VALUES (p_aircraft, GREATEST(p_gal,0), p_method, p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: let any authenticated user insert snapshots (append-only)
ALTER TABLE public.aircraft_fuel_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='afs_select_all_auth') THEN
    CREATE POLICY afs_select_all_auth ON public.aircraft_fuel_status
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='afs_insert_all_auth') THEN
    CREATE POLICY afs_insert_all_auth ON public.aircraft_fuel_status
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.aircraft a WHERE a.id = aircraft_id AND a.usable_fuel_gal IS NOT NULL));
  END IF;
END $$;

REVOKE UPDATE, DELETE ON public.aircraft_fuel_status FROM authenticated;

-- ========= Smart fuel orders (Add qty / Tabs / Tabs+ / Full) =========
CREATE TABLE IF NOT EXISTS public.fuel_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  target fuel_order_target NOT NULL,
  add_quantity_gal numeric(6,1),
  tabs_plus_gal numeric(6,1),
  computed_add_gal numeric(6,1),
  snapshot_gal_onboard numeric(6,1),
  fuel_type fuel_type,
  status text NOT NULL DEFAULT 'requested', -- requested|completed|canceled
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid DEFAULT auth.uid(),
  notes text,
  applied_directive fuel_billing_directive,
  applied_fbo_id uuid REFERENCES public.fbos(id)
);

CREATE OR REPLACE FUNCTION public.fuel_orders_compute()
RETURNS trigger AS $$
DECLARE
  full_gal numeric(6,1);
  tabs_gal numeric(6,1);
  current_gal numeric(6,1);
BEGIN
  SELECT a.fuel_type, a.usable_fuel_gal, a.tabs_fuel_gal
    INTO NEW.fuel_type, full_gal, tabs_gal
  FROM public.aircraft a WHERE a.id = NEW.aircraft_id;

  IF NEW.fuel_type IS NULL OR full_gal IS NULL OR tabs_gal IS NULL THEN
    RAISE EXCEPTION 'Aircraft % missing fuel_type/usable/tabs', NEW.aircraft_id;
  END IF;

  SELECT v.gallons_onboard INTO current_gal FROM public.v_aircraft_fuel_latest v WHERE v.aircraft_id = NEW.aircraft_id;
  IF current_gal IS NULL THEN current_gal := 0; END IF;

  NEW.snapshot_gal_onboard := current_gal;

  IF NEW.target = 'ADD_QUANTITY' THEN
    IF NEW.add_quantity_gal IS NULL OR NEW.add_quantity_gal <= 0 THEN
      RAISE EXCEPTION 'add_quantity_gal must be > 0';
    END IF;
    NEW.computed_add_gal := LEAST(NEW.add_quantity_gal, GREATEST(full_gal - current_gal, 0));

  ELSIF NEW.target = 'FILL_TO_TABS' THEN
    NEW.computed_add_gal := GREATEST(tabs_gal - current_gal, 0);

  ELSIF NEW.target = 'FILL_TO_TABS_PLUS' THEN
    IF NEW.tabs_plus_gal IS NULL OR NEW.tabs_plus_gal < 0 THEN
      RAISE EXCEPTION 'tabs_plus_gal must be >= 0';
    END IF;
    NEW.computed_add_gal := GREATEST(LEAST(tabs_gal + NEW.tabs_plus_gal, full_gal) - current_gal, 0);

  ELSIF NEW.target = 'FILL_TO_FULL' THEN
    NEW.computed_add_gal := GREATEST(full_gal - current_gal, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fuel_orders_compute ON public.fuel_orders;
CREATE TRIGGER trg_fuel_orders_compute
BEFORE INSERT ON public.fuel_orders
FOR EACH ROW EXECUTE FUNCTION public.fuel_orders_compute();

-- ========= FBOs + directives (scalable “who pays” per tail@FBO) =========
CREATE TABLE IF NOT EXISTS public.fbos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  airport_icao text NOT NULL,
  email_receipts_to text,
  phone text
);

CREATE TABLE IF NOT EXISTS public.fuel_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  fbo_id uuid NOT NULL REFERENCES public.fbos(id) ON DELETE CASCADE,
  directive fuel_billing_directive NOT NULL,
  client_card_last4 text,
  client_card_brand text,
  client_card_exp text,
  authorization_doc_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aircraft_id, fbo_id, active)
);

CREATE OR REPLACE FUNCTION public.fuel_orders_apply_directive()
RETURNS trigger AS $$
BEGIN
  IF NEW.applied_fbo_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT fa.directive INTO NEW.applied_directive
  FROM public.fuel_authorizations fa
  WHERE fa.aircraft_id = NEW.aircraft_id
    AND fa.fbo_id = NEW.applied_fbo_id
    AND fa.active = true
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fuel_orders_apply_directive ON public.fuel_orders;
CREATE TRIGGER trg_fuel_orders_apply_directive
BEFORE INSERT ON public.fuel_orders
FOR EACH ROW EXECUTE FUNCTION public.fuel_orders_apply_directive();

-- ========= Client billing profiles (Stripe/FBO metadata; NO PAN) =========
CREATE TABLE IF NOT EXISTS public.client_billing_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_default_pm_id text,
  display_brand text,
  display_last4 text,
  display_exp text,
  fbo_card_brand text,
  fbo_card_last4 text,
  fbo_card_exp text,
  fbo_authorization_doc_url text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_fbo_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fbo_id uuid NOT NULL REFERENCES public.fbos(id) ON DELETE CASCADE,
  card_brand text,
  card_last4 text,
  card_exp text,
  authorization_doc_url text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, fbo_id, active)
);

-- ========= Optional: create charges only when FA card is used =========
CREATE TABLE IF NOT EXISTS public.settings (
  id int PRIMARY KEY DEFAULT 1,
  default_fuel_rate numeric(10,2)
);
INSERT INTO public.settings(id, default_fuel_rate)
VALUES (1, 8.25)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.fuel_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_log_id uuid REFERENCES public.fuel_logs(id) ON DELETE CASCADE,
  aircraft_id uuid REFERENCES public.aircraft(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id),
  gallons numeric(6,1),
  unit_price numeric(10,2),
  total_price numeric(10,2) GENERATED ALWAYS AS (gallons * unit_price) STORED,
  payment_status text DEFAULT 'pending',  -- pending|paid|reimbursed|external_paid
  paid_via text DEFAULT 'FA_CORP_CARD',   -- FA_CORP_CARD|CLIENT_CARD_ON_FILE|DIRECT_TO_FBO
  invoice_id text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.after_fuel_log_create_charge()
RETURNS trigger AS $$
DECLARE
  owner uuid;
  rate numeric;
  order_directive text;
BEGIN
  SELECT a.owner_id INTO owner FROM public.aircraft a WHERE a.id = NEW.aircraft_id;
  SELECT default_fuel_rate INTO rate FROM public.settings LIMIT 1;

  SELECT fo.applied_directive INTO order_directive
  FROM public.fuel_orders fo
  WHERE fo.aircraft_id = NEW.aircraft_id
    AND fo.requested_at > now() - interval '6 hours'
  ORDER BY fo.requested_at DESC
  LIMIT 1;

  IF order_directive = 'FA_CARD_REBILL_CLIENT' THEN
    INSERT INTO public.fuel_charges(
      fuel_log_id, aircraft_id, client_id, gallons, unit_price, paid_via, payment_status
    ) VALUES (
      NEW.id, NEW.aircraft_id, owner, NEW.quantity, COALESCE(rate,0), 'FA_CORP_CARD', 'pending'
    );
  ELSIF order_directive = 'DIRECT_TO_FBO_CLIENT_CARD' THEN
    INSERT INTO public.fuel_charges(
      fuel_log_id, aircraft_id, client_id, gallons, unit_price, paid_via, payment_status
    ) VALUES (
      NEW.id, NEW.aircraft_id, owner, NEW.quantity, COALESCE(rate,0), 'CLIENT_CARD_ON_FILE', 'external_paid'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_fuel_log_create_charge ON public.fuel_logs;
CREATE TRIGGER trg_after_fuel_log_create_charge
AFTER INSERT ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.after_fuel_log_create_charge();