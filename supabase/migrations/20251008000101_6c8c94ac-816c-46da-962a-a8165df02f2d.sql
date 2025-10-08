-- Add hobbs and tach time fields to aircraft table
ALTER TABLE public.aircraft
ADD COLUMN hobbs_time numeric,
ADD COLUMN tach_time numeric;

COMMENT ON COLUMN public.aircraft.hobbs_time IS 'Current Hobbs meter reading in hours';
COMMENT ON COLUMN public.aircraft.tach_time IS 'Current Tachometer reading in hours';