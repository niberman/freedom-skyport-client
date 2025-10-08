-- Allow system triggers to create profiles and assign default roles
CREATE POLICY "System can create profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.uid() IS NULL
  );

CREATE POLICY "System can assign default roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IS NULL
  );
