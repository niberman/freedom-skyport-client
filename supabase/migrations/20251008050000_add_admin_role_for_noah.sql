-- Grant admin role to Noah
-- Safely insert admin role for existing user(s) by email.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('noahberman14@gmail.com','noah@freedomaviationco.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Optional verification select (commented out to keep migration idempotent quietly)
-- SELECT u.email, ur.role FROM auth.users u
-- JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE u.email IN ('noahberman14@gmail.com','noah@freedomaviationco.com');
