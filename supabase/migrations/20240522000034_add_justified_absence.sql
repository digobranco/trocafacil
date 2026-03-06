-- Update appointment status constraint to include 'justified_absence'
-- First, we need to drop the existing constraint
DO $$ 
BEGIN 
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Then add the new one with justified_absence
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'absent', 'justified_absence'));
