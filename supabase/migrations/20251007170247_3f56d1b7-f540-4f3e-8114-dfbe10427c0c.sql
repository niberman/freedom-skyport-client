-- Ensure RLS is enabled on flight_hours table
ALTER TABLE public.flight_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with complete coverage
DROP POLICY IF EXISTS "Admins can manage all flight hours" ON public.flight_hours;
DROP POLICY IF EXISTS "Owners can insert their own flight hours" ON public.flight_hours;
DROP POLICY IF EXISTS "Owners can view their own flight hours" ON public.flight_hours;

-- Comprehensive RLS policies for flight_hours table

-- Admins can do everything
CREATE POLICY "Admins can manage all flight hours"
ON public.flight_hours
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owners can view only their own flight hours
CREATE POLICY "Owners can view their own flight hours"
ON public.flight_hours
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Owners can insert only their own flight hours
CREATE POLICY "Owners can insert their own flight hours"
ON public.flight_hours
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Owners can update only their own flight hours
CREATE POLICY "Owners can update their own flight hours"
ON public.flight_hours
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Owners can delete only their own flight hours
CREATE POLICY "Owners can delete their own flight hours"
ON public.flight_hours
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);