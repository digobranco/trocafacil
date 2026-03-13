-- Add used_at column to pre_anamnesis_tokens
ALTER TABLE public.pre_anamnesis_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ DEFAULT NULL;
