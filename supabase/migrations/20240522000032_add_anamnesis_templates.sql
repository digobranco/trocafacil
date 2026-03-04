-- Create anamnesis_templates table for tenant-customizable questions
CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type TEXT DEFAULT 'textarea' CHECK (field_type IN ('text', 'textarea', 'boolean', 'select')),
    options JSONB,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;

-- Staff can view templates of their tenant
CREATE POLICY "Staff can view anamnesis templates" ON public.anamnesis_templates
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- Admin can manage templates
CREATE POLICY "Admin can manage anamnesis templates" ON public.anamnesis_templates
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
