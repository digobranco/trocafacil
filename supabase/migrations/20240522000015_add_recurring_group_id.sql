-- Add recurring_group_id to appointments to allow grouping of recurring events
ALTER TABLE public.appointments ADD COLUMN recurring_group_id uuid;

-- Index for performance when deleting series
CREATE INDEX idx_appointments_recurring_group_id ON public.appointments(recurring_group_id);
