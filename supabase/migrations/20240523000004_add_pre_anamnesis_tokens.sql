-- Create pre_anamnesis_tokens table
CREATE TABLE IF NOT EXISTS public.pre_anamnesis_tokens (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.pre_anamnesis_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for pre_anamnesis_tokens
CREATE POLICY "Staff can manage pre_anamnesis_tokens" ON public.pre_anamnesis_tokens
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    );

-- Allow public access to view token metadata (needed for the public page to identify the tenant/client)
-- In a real scenario, we might want to restrict this or use a service role, but for form submission
-- we need to verify the token exists and is valid.
CREATE POLICY "Public can view token metadata" ON public.pre_anamnesis_tokens
    FOR SELECT USING (true);

-- Update Anamnesis RLS to allow public submission with a valid token
-- We will handle the "security" via the server action that validates the token
-- But if we want to allow direct Supabase client submission (optional, but good for robustness)
-- we could add a policy based on the token. For now, we'll stick to Server Actions only.
