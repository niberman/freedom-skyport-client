-- Add columns to service_requests table to support Pre-Flight Concierge features
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS requested_departure timestamp with time zone,
ADD COLUMN IF NOT EXISTS fuel_grade text,
ADD COLUMN IF NOT EXISTS fuel_quantity numeric,
ADD COLUMN IF NOT EXISTS o2_topoff boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tks_topoff boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gpu_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hangar_pullout boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS cabin_provisioning jsonb;

-- Add comment to describe the table
COMMENT ON TABLE public.service_requests IS 'Service requests including Pre-Flight Concierge with detailed aircraft preparation options';

-- Add comments to new columns
COMMENT ON COLUMN public.service_requests.requested_departure IS 'Requested departure date and time for flight';
COMMENT ON COLUMN public.service_requests.fuel_grade IS 'Fuel type (100LL, Jet-A, Jet-A+, MOGAS)';
COMMENT ON COLUMN public.service_requests.fuel_quantity IS 'Fuel quantity in gallons';
COMMENT ON COLUMN public.service_requests.o2_topoff IS 'Whether oxygen top-off is requested';
COMMENT ON COLUMN public.service_requests.tks_topoff IS 'Whether TKS fluid top-off is requested';
COMMENT ON COLUMN public.service_requests.gpu_required IS 'Whether ground power unit is required';
COMMENT ON COLUMN public.service_requests.hangar_pullout IS 'Whether hangar pull-out is requested';
COMMENT ON COLUMN public.service_requests.cabin_provisioning IS 'Cabin provisioning details (JSON format for water, snacks, etc.)';