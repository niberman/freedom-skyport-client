-- Create service_requests table if missing
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add airport column even if running later
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS airport text DEFAULT 'KAPA';

-- Enable RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'service_requests'
  ) THEN
    RAISE EXCEPTION 'service_requests table should exist by now';
  END IF;
END$$;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Policies (create if missing)
DO $policies$
BEGIN
  -- Users can view their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own service requests'
  ) THEN
    CREATE POLICY "Users can view their own service requests"
    ON public.service_requests
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Users can create their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can create their own service requests'
  ) THEN
    CREATE POLICY "Users can create their own service requests"
    ON public.service_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own service requests'
  ) THEN
    CREATE POLICY "Users can update their own service requests"
    ON public.service_requests
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can view all service requests'
  ) THEN
    CREATE POLICY "Admins can view all service requests"
    ON public.service_requests
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Admins can manage all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can manage all service requests'
  ) THEN
    CREATE POLICY "Admins can manage all service requests"
    ON public.service_requests
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$policies$;

-- updated_at trigger (assumes handle_updated_at exists)
DO $trg$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$trg$;