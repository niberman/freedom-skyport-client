-- Fix activity_logs INSERT policy to prevent unauthorized log injection
-- Drop the insecure policy
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;

-- Create secure INSERT policies

-- Allow admins to insert any logs (for system operations)
CREATE POLICY "Admins can insert logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert only their own logs
CREATE POLICY "Users can insert their own logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure activity_logs table has proper constraints
-- Make user_id NOT NULL to prevent anonymous log entries
ALTER TABLE public.activity_logs
ALTER COLUMN user_id SET NOT NULL;