-- Allow public anon users to update tokens (specifically so they can mark them as used)
CREATE POLICY "Allow public token updates" ON public.pre_anamnesis_tokens
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);
