-- Migration: Add professional_services table
-- Purpose: Establish links between professionals and services with optional custom pricing
-- Phase 1 of service model refactoring

-- Create professional_services table
CREATE TABLE public.professional_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  custom_price DECIMAL(10,2),  -- NULL = uses service default price
  custom_duration_minutes INTEGER,  -- NULL = uses service default duration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one entry per professional-service pair
  UNIQUE(professional_id, service_id)
);

-- Add indexes for performance
CREATE INDEX idx_professional_services_professional ON public.professional_services(professional_id);
CREATE INDEX idx_professional_services_service ON public.professional_services(service_id);
CREATE INDEX idx_professional_services_tenant ON public.professional_services(tenant_id);

-- Enable RLS
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view professional services from their tenant
CREATE POLICY "Users can view tenant professional services" ON public.professional_services
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Only admins can manage professional services
CREATE POLICY "Admins can manage professional services" ON public.professional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.tenant_id = public.professional_services.tenant_id
    )
  );

-- Seed: Link all existing professionals to all services in their tenant
-- This maintains backward compatibility with existing data
INSERT INTO public.professional_services (tenant_id, professional_id, service_id, is_active)
SELECT 
  p.tenant_id,
  p.id as professional_id,
  s.id as service_id,
  true as is_active
FROM public.professionals p
CROSS JOIN public.services s
WHERE p.tenant_id = s.tenant_id
  AND p.active = true
  AND s.active = true
ON CONFLICT (professional_id, service_id) DO NOTHING;
