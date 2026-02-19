-- Migration: Fase 2 - Planos de Assinatura (Membership Plans)
-- Criar tabelas: membership_plans, client_memberships
-- Alterar tabela: credits (adicionar campos de origem)

---------------------------------------------------
-- 1. MEMBERSHIP PLANS (tipos de plano do tenant)
---------------------------------------------------
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                -- Ex: "Pilates 2x/semana"
  description TEXT,
  plan_type TEXT CHECK (plan_type IN (
    'weekly_frequency',              -- Principal: 2x/semana
    'monthly_credits',               -- Alternativo: 8 créditos/mês
    'package',                       -- Pacote avulso: 10 aulas
    'unlimited'                      -- Ilimitado (1x/dia)
  )) NOT NULL,
  
  -- Preço
  monthly_price DECIMAL(10,2),       -- Preço mensal (weekly_frequency, monthly_credits, unlimited)
  package_price DECIMAL(10,2),       -- Preço do pacote (package)
  
  -- Configurações de créditos
  weekly_frequency INTEGER,          -- Para weekly_frequency: 1, 2, 3, 5...
  credits_per_month INTEGER,         -- Para monthly_credits
  total_credits INTEGER,             -- Para package
  credit_validity_days INTEGER DEFAULT 30,
  
  -- Restrições opcionais
  service_restrictions JSONB,        -- ["uuid1", "uuid2"] ou NULL = qualquer serviço
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices
CREATE INDEX idx_membership_plans_tenant ON public.membership_plans(tenant_id);
CREATE INDEX idx_membership_plans_active ON public.membership_plans(tenant_id, is_active);

---------------------------------------------------
-- 2. CLIENT MEMBERSHIPS (assinatura do cliente)
---------------------------------------------------
CREATE TABLE public.client_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  membership_plan_id UUID REFERENCES public.membership_plans(id) NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE,                     -- NULL = ativo indefinidamente
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
  weekly_limit INTEGER,              -- Cópia do weekly_frequency do plano
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices
CREATE INDEX idx_client_memberships_client ON public.client_memberships(client_id);
CREATE INDEX idx_client_memberships_tenant ON public.client_memberships(tenant_id);
CREATE INDEX idx_client_memberships_status ON public.client_memberships(client_id, status);

---------------------------------------------------
-- 3. ALTERAR CREDITS (adicionar origem)
---------------------------------------------------
ALTER TABLE public.credits
  ADD COLUMN IF NOT EXISTS membership_plan_id UUID REFERENCES public.membership_plans(id),
  ADD COLUMN IF NOT EXISTS service_restrictions JSONB,
  ADD COLUMN IF NOT EXISTS origin_type TEXT CHECK (origin_type IN ('plan', 'package', 'makeup', 'promo', 'manual'));

---------------------------------------------------
-- 4. RLS POLICIES
---------------------------------------------------

-- membership_plans: todos do tenant podem ver, apenas admin pode gerenciar
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant membership plans" ON public.membership_plans
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage membership plans" ON public.membership_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.tenant_id = public.membership_plans.tenant_id
    )
  );

-- client_memberships: todos do tenant podem ver, admin pode gerenciar
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant client memberships" ON public.client_memberships
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage client memberships" ON public.client_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.tenant_id = public.client_memberships.tenant_id
    )
  );

-- Allow customers to view their own memberships
CREATE POLICY "Customers can view own memberships" ON public.client_memberships
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.customers WHERE profile_id = auth.uid()
    )
  );
