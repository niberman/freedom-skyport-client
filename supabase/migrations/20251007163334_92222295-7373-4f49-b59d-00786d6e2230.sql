-- Create memberships table
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL, -- 'basic', 'premium', 'elite', etc.
  start_date timestamptz DEFAULT now() NOT NULL,
  end_date timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add credit fields to services table
ALTER TABLE public.services
ADD COLUMN credits_required integer DEFAULT 1,
ADD COLUMN can_rollover boolean DEFAULT false,
ADD COLUMN credits_per_period integer DEFAULT 0;

-- Create service_credits table to track owner credits
CREATE TABLE public.service_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  credits_available integer DEFAULT 0,
  credits_used_this_period integer DEFAULT 0,
  last_reset_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, service_id)
);

-- Add extra_charge flag to service_requests
ALTER TABLE public.service_requests
ADD COLUMN is_extra_charge boolean DEFAULT false,
ADD COLUMN credits_used integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memberships
CREATE POLICY "Owners can view their own membership"
ON public.memberships
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all memberships"
ON public.memberships
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for service_credits
CREATE POLICY "Owners can view their own credits"
ON public.service_credits
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all credits"
ON public.service_credits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_memberships_owner ON public.memberships(owner_id);
CREATE INDEX idx_memberships_active ON public.memberships(active);
CREATE INDEX idx_service_credits_owner ON public.service_credits(owner_id);
CREATE INDEX idx_service_credits_service ON public.service_credits(service_id);

-- Add triggers for updated_at
CREATE TRIGGER update_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_service_credits_updated_at
BEFORE UPDATE ON public.service_credits
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update existing services with credit information
UPDATE public.services SET credits_required = 1, can_rollover = false, credits_per_period = 1 WHERE category = 'detailing';
UPDATE public.services SET credits_required = 1, can_rollover = true, credits_per_period = 4 WHERE category = 'maintenance' AND name = 'Oil Change';
UPDATE public.services SET credits_required = 1, can_rollover = false, credits_per_period = 1 WHERE category = 'readiness';
UPDATE public.services SET credits_required = 1, can_rollover = true, credits_per_period = 12 WHERE category = 'concierge' AND name = 'Fuel Service';