-- Create service_tasks table for tracking aircraft service work
CREATE TABLE IF NOT EXISTS public.service_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  hosted_invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_lines table
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_cents integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_tasks
CREATE POLICY "Owners can view tasks for their aircraft"
  ON public.service_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.aircraft
      WHERE aircraft.id = service_tasks.aircraft_id
      AND aircraft.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all tasks"
  ON public.service_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for invoices
CREATE POLICY "Owners can view their invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for invoice_lines
CREATE POLICY "Owners can view their invoice lines"
  ON public.invoice_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_lines.invoice_id
      AND invoices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all invoice lines"
  ON public.invoice_lines FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_service_tasks_aircraft ON public.service_tasks(aircraft_id);
CREATE INDEX idx_service_tasks_status ON public.service_tasks(status);
CREATE INDEX idx_invoices_aircraft ON public.invoices(aircraft_id);
CREATE INDEX idx_invoices_owner ON public.invoices(owner_id);
CREATE INDEX idx_invoice_lines_invoice ON public.invoice_lines(invoice_id);

-- Add update triggers
CREATE TRIGGER update_service_tasks_updated_at
  BEFORE UPDATE ON public.service_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();