-- Add policy to allow public submission of anamnesis if a valid token exists
-- This allows the public form to save data without a logged-in user
CREATE POLICY "Allow public submission via pre-anamnesis token" ON public.anamnesis
    FOR ALL 
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.pre_anamnesis_tokens 
            WHERE client_id = public.anamnesis.client_id 
            AND tenant_id = public.anamnesis.tenant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pre_anamnesis_tokens 
            WHERE client_id = public.anamnesis.client_id 
            AND tenant_id = public.anamnesis.tenant_id
        )
    );

-- Also ensure pre_anamnesis_tokens can be read by public (already done but reinforcing)
-- We need to ensure the anon role can actually use the EXISTS subquery
ALTER TABLE public.pre_anamnesis_tokens ENABLE ROW LEVEL SECURITY;

-- If not already present, allow public to select from pre_anamnesis_tokens
-- so the EXISTS check in the anamnesis policy works for the 'anon' role.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_anamnesis_tokens' AND policyname = 'Public can view token metadata'
    ) THEN
        CREATE POLICY "Public can view token metadata" ON public.pre_anamnesis_tokens
            FOR SELECT USING (true);
    END IF;
END $$;
