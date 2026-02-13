-- Add cancellation settings to tenants
ALTER TABLE public.tenants ADD COLUMN cancellation_window_hours integer DEFAULT 24;
ALTER TABLE public.tenants ADD COLUMN credit_validity_days integer DEFAULT 30;

-- Ensure credits table is correct and has unique constraint or useful indexes
-- (credits table was created in init_schema)
CREATE INDEX IF NOT EXISTS idx_credits_client_tenant ON public.credits(client_id, tenant_id);
