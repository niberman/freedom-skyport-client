-- Create services table for managing service options
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'maintenance', 'detailing', 'readiness', 'training', 'concierge'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add service_id to service_requests (nullable for custom requests)
ALTER TABLE public.service_requests
ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_service_requests_service_id ON public.service_requests(service_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_active ON public.services(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default services
INSERT INTO public.services (name, description, category) VALUES
('Aircraft Detailing', 'Professional interior and exterior detailing', 'detailing'),
('Pre-Flight Inspection', 'Comprehensive pre-flight check', 'readiness'),
('Oil Change', 'Engine oil and filter change', 'maintenance'),
('Annual Inspection', 'FAA-required annual inspection', 'maintenance'),
('Avionics Update', 'Software and database updates', 'maintenance'),
('Interior Cleaning', 'Deep clean of aircraft interior', 'detailing'),
('Fuel Service', 'Aircraft refueling coordination', 'concierge'),
('Hangar Coordination', 'Hangar space arrangement', 'concierge'),
('Flight Planning Assistance', 'Route planning and weather briefing', 'concierge'),
('IPC/BFR Training', 'Instrument proficiency check or biennial flight review', 'training');