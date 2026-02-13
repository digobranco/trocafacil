-- Fix credits table to reference customers and add RLS
ALTER TABLE public.credits DROP CONSTRAINT IF EXISTS credits_client_id_fkey;
ALTER TABLE public.credits 
  ADD CONSTRAINT credits_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Policies for credits
CREATE POLICY "Users can view credits of their tenant" ON public.credits
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage credits of their tenant" ON public.credits
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );
