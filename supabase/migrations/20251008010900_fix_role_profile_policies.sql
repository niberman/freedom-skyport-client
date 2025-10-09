DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_roles'
      AND policyname = 'System can assign default roles'
  ) THEN
    CREATE POLICY "System can assign default roles"
      ON public.user_roles
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        OR auth.uid() IS NULL
      );
  END IF;
END
$$;