-- Create anamnesis table
CREATE TABLE IF NOT EXISTS public.anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id)
);

-- Create evolutions table
CREATE TABLE IF NOT EXISTS public.evolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;

-- Policies for Anamnesis
CREATE POLICY "Staff can view anamnesis" ON public.anamnesis
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    );

CREATE POLICY "Staff can manage anamnesis" ON public.anamnesis
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    );

-- Policies for Evolutions
CREATE POLICY "Staff can view evolutions" ON public.evolutions
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    );

CREATE POLICY "Staff can manage evolutions" ON public.evolutions
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'customer'
    );
