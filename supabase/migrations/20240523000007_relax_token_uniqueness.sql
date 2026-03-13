-- Remove the unique constraint that prevents generating new tokens for the same client/tenant
-- This allows admins to generate NEW links even if one already exists (e.g. if the previous one was used)
ALTER TABLE public.pre_anamnesis_tokens DROP CONSTRAINT IF EXISTS pre_anamnesis_tokens_client_id_tenant_id_key;
