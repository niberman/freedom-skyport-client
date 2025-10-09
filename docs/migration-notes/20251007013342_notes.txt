import * as ReactQuery from "@tanstack/react-query";

const queryClient = new ReactQuery.QueryClient();

<ReactQuery.QueryClientProvider client={queryClient}>
  {/* other components */}
</ReactQuery.QueryClientProvider>
-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own service requests
CREATE POLICY "Users can view their own service requests"
ON public.service_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own service requests
CREATE POLICY "Users can create their own service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own service requests
CREATE POLICY "Users can update their own service requests"
ON public.service_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all service requests
CREATE POLICY "Admins can view all service requests"
ON public.service_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all service requests
CREATE POLICY "Admins can manage all service requests"
ON public.service_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();