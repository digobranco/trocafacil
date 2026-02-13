-- Create credit logs table
CREATE TABLE IF NOT EXISTS public.credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('usage', 'addition', 'cancellation_refund', 'manual_adjustment')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view credit logs" ON public.credit_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ) AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
      OR 
      client_id IN (
        SELECT id FROM public.customers WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins/Professionals can insert credit logs" ON public.credit_logs
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ) AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    )
  );
