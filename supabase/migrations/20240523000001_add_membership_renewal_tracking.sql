-- Add renewal tracking columns to client_memberships
ALTER TABLE public.client_memberships
ADD COLUMN IF NOT EXISTS next_renewal_date DATE,
ADD COLUMN IF NOT EXISTS renewal_duration_months INTEGER DEFAULT 1;

-- Update existing active memberships so they have a default next renewal date (end of current month)
UPDATE public.client_memberships
SET next_renewal_date = (date_trunc('month', CURRENT_DATE) + interval '1 month')::date
WHERE status = 'active' AND next_renewal_date IS NULL;
