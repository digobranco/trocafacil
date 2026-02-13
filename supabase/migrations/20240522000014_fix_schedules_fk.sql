-- Fix FK constraint for schedules table
-- Change professional_id to reference professionals instead of profiles

-- IMPORTANT: First, delete any schedules that have professional_id 
-- pointing to profiles instead of professionals
-- This is necessary because the old system linked to user profiles, 
-- but now we link to the professionals table

-- Drop old constraint
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_professional_id_fkey;

-- Delete orphaned schedules (professional_id not in professionals table)
DELETE FROM public.schedules 
WHERE professional_id NOT IN (SELECT id FROM public.professionals);

-- Add new constraint referencing professionals table
ALTER TABLE public.schedules 
  ADD CONSTRAINT schedules_professional_id_fkey 
  FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
