-- Add appointment_id to evolutions to link clinical records to specific sessions
ALTER TABLE public.evolutions 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Update appointment status constraint to include 'absent'
-- First, we need to drop the existing constraint
DO $$ 
BEGIN 
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Then add the new one
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'absent'));
