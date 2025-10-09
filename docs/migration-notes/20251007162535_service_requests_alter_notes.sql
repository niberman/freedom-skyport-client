-- Add airport field to service_requests table for multi-airport operations
ALTER TABLE public.service_requests 
ADD COLUMN airport text DEFAULT 'KAPA';

-- Add index for airport field for better query performance
CREATE INDEX idx_service_requests_airport ON public.service_requests(airport);

-- Add comment to document the column
COMMENT ON COLUMN public.service_requests.airport IS 'Airport code where the service is performed (e.g., KAPA, BJC, KEGE)';