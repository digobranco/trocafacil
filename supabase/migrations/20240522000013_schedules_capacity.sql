-- Add capacity field to schedules table
-- This allows setting how many people can book the same time slot

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.schedules.max_participants IS 'Maximum number of participants that can book this time slot. Default 1 for individual sessions.';
