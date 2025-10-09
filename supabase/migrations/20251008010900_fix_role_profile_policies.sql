-- Idempotent create for "System can create profiles"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'System can create profiles'
  ) THEN
    CREATE POLICY "System can create profiles"
      ON public.profiles
      FOR INSERT
      WITH CHECK (
        auth.uid() = id
        OR auth.uid() IS NULL
      );
  END IF;
END
$$;

CREATE POLICY "System can assign default roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IS NULL
  );
