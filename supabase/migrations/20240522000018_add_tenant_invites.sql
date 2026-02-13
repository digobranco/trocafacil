-- Add invite_code and is_active to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substring(md5(random()::text), 1, 8);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ensure existing rows have unique invite codes (the default md5 will handle new ones, but for safety on existing)
UPDATE public.tenants SET invite_code = substring(md5(random()::text), 1, 8) WHERE invite_code IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenants_invite_code ON public.tenants(invite_code);
