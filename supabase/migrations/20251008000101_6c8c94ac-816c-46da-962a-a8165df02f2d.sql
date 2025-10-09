-- Add hobbs and tach time fields to aircraft table (idempotent)
ALTER TABLE public.aircraft
  ADD COLUMN IF NOT EXISTS hobbs_time numeric,
  ADD COLUMN IF NOT EXISTS tach_time numeric;