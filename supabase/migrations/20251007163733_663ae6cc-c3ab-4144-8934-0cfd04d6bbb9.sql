-- Create membership_tiers table for tier definitions
CREATE TABLE public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  base_price numeric(10,2),
  description text,
  min_hours_per_month numeric(5,2) DEFAULT 0,
  max_hours_per_month numeric(5,2),
  credit_multiplier numeric(3,2) DEFAULT 1.0, -- multiplier for base credits
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flight_hours table to track monthly flight hours
CREATE TABLE public.flight_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid REFERENCES public.aircraft(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flight_date date NOT NULL,
  hours_flown numeric(5,2) NOT NULL,
  departure_airport text,
  arrival_airport text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add tier reference to memberships
ALTER TABLE public.memberships
ADD COLUMN tier_id uuid REFERENCES public.membership_tiers(id) ON DELETE SET NULL;

-- Update services table to include base credits and scaling
ALTER TABLE public.services
ADD COLUMN base_credits_low_activity integer DEFAULT 0,
ADD COLUMN base_credits_high_activity integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_tiers
CREATE POLICY "Anyone can view active tiers"
ON public.membership_tiers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
ON public.membership_tiers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for flight_hours
CREATE POLICY "Owners can view their own flight hours"
ON public.flight_hours
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own flight hours"
ON public.flight_hours
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all flight hours"
ON public.flight_hours
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_flight_hours_owner ON public.flight_hours(owner_id);
CREATE INDEX idx_flight_hours_aircraft ON public.flight_hours(aircraft_id);
CREATE INDEX idx_flight_hours_date ON public.flight_hours(flight_date);
CREATE INDEX idx_membership_tiers_active ON public.membership_tiers(is_active);

-- Add triggers for updated_at
CREATE TRIGGER update_membership_tiers_updated_at
BEFORE UPDATE ON public.membership_tiers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_flight_hours_updated_at
BEFORE UPDATE ON public.flight_hours
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default membership tiers
INSERT INTO public.membership_tiers (name, description, min_hours_per_month, max_hours_per_month, credit_multiplier, base_price) VALUES
('Light Flyer', 'For pilots flying 0-5 hours per month', 0, 5, 0.5, 299.00),
('Regular Flyer', 'For pilots flying 5-15 hours per month', 5, 15, 1.0, 499.00),
('Frequent Flyer', 'For pilots flying 15-30 hours per month', 15, 30, 1.5, 799.00),
('Professional', 'For pilots flying 30+ hours per month', 30, NULL, 2.0, 1299.00);

-- Update existing services with activity-based credits
UPDATE public.services 
SET base_credits_low_activity = 1, base_credits_high_activity = 2
WHERE category = 'detailing';

UPDATE public.services 
SET base_credits_low_activity = 2, base_credits_high_activity = 4
WHERE category = 'maintenance';

UPDATE public.services 
SET base_credits_low_activity = 1, base_credits_high_activity = 3
WHERE category = 'readiness';

UPDATE public.services 
SET base_credits_low_activity = 6, base_credits_high_activity = 12
WHERE category = 'concierge';

UPDATE public.services 
SET base_credits_low_activity = 0, base_credits_high_activity = 2
WHERE category = 'training';