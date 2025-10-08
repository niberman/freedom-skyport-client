-- Add aircraft for noahberman14@gmail.com user
INSERT INTO public.aircraft (
  tail_number,
  model,
  owner_id,
  base_location,
  status,
  hobbs_time,
  tach_time
) VALUES (
  'N123AB',
  'Cessna 172',
  (SELECT id FROM auth.users WHERE email = 'noahberman14@gmail.com'),
  'KAPA',
  'active',
  1250.5,
  1180.3
);