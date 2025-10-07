-- Seed initial user role for Noah (owner)
-- This assumes Noah's user already exists in auth.users
-- You can find the user_id by checking the auth.users table

-- Insert Noah as owner (replace with actual user_id from auth.users if different)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role
FROM auth.users
WHERE email = 'noah@freedomaviationco.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create trigger to auto-assign 'owner' role to new signups
-- This prevents future users from having no role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();