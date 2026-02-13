-- Fix FK constraints for appointments table
-- Change client_id to reference customers instead of profiles
-- Change professional_id to reference professionals instead of profiles

-- Drop old constraints
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;

-- Add new constraints
ALTER TABLE public.appointments 
  ADD CONSTRAINT appointments_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.appointments 
  ADD CONSTRAINT appointments_professional_id_fkey 
  FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;
