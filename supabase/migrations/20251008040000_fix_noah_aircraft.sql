-- Update aircraft ownership to ensure it's properly linked to noah user
-- First, let's see if there are any aircraft without proper owner_id
UPDATE public.aircraft 
SET owner_id = (
  SELECT id FROM auth.users WHERE email = 'noahberman14@gmail.com'
)
WHERE tail_number = 'N123AB' 
  AND (owner_id IS NULL OR owner_id != (SELECT id FROM auth.users WHERE email = 'noahberman14@gmail.com'));

-- If no aircraft exists, insert it
INSERT INTO public.aircraft (
  tail_number,
  model,
  owner_id,
  base_location,
  status,
  hobbs_time,
  tach_time
)
SELECT 
  'N123AB',
  'Cessna 172',
  u.id,
  'KAPA',
  'active',
  1250.5,
  1180.3
FROM auth.users u
WHERE u.email = 'noahberman14@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.aircraft WHERE tail_number = 'N123AB'
  );