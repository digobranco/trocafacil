-- Migration: 20240523000003_add_holidays.sql
-- Goal: Create holidays table and seed national holidays for 2024-2034

CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for national holidays
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, -- Match start_date for single day holidays
    is_national BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices
CREATE INDEX idx_holidays_tenant_date ON public.holidays(tenant_id, start_date);
CREATE INDEX idx_holidays_national ON public.holidays(is_national) WHERE is_national = true;

-- RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view national holidays
CREATE POLICY "Anyone can view national holidays" ON public.holidays
    FOR SELECT USING (is_national = true OR tenant_id IS NULL);

-- Users can view their tenant's holidays
CREATE POLICY "Users can view tenant holidays" ON public.holidays
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Admins can manage their tenant's holidays
CREATE POLICY "Admins can manage holidays" ON public.holidays
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.tenant_id = public.holidays.tenant_id
        )
    );

-----------------------------------------------------------
-- SEEDING NATIONAL HOLIDAYS (2024 - 2034)
-----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_easter(p_year INTEGER) 
RETURNS DATE AS $$
DECLARE
    a INTEGER; b INTEGER; c INTEGER; d INTEGER; e INTEGER; f INTEGER;
    g INTEGER; h INTEGER; i INTEGER; k INTEGER; l INTEGER; m INTEGER;
    p_month INTEGER; p_day INTEGER;
BEGIN
    a := p_year % 19;
    b := floor(p_year / 100);
    c := p_year % 100;
    d := floor(b / 4); e := b % 4;
    f := floor((b + 8) / 25);
    g := floor((b - f + 1) / 3);
    h := (19 * a + b - d - g + 15) % 30;
    i := floor(c / 4); k := c % 4;
    l := (32 + 2 * e + 2 * i - h - k) % 7;
    m := floor((a + 11 * h + 22 * l) / 451);
    p_month := floor((h + l - 7 * m + 114) / 31);
    p_day := ((h + l - 7 * m + 114) % 31) + 1;
    RETURN (p_year || '-' || p_month || '-' || p_day)::DATE;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    v_year INTEGER;
    v_easter DATE;
BEGIN
    FOR v_year IN 2024..2034 LOOP
        -- FIXED HOLIDAYS
        INSERT INTO public.holidays (name, start_date, end_date, is_national) VALUES
        ('Confraternização Universal', (v_year || '-01-01')::DATE, (v_year || '-01-01')::DATE, true),
        ('Tiradentes', (v_year || '-04-21')::DATE, (v_year || '-04-21')::DATE, true),
        ('Dia do Trabalho', (v_year || '-05-01')::DATE, (v_year || '-05-01')::DATE, true),
        ('Independência do Brasil', (v_year || '-09-07')::DATE, (v_year || '-09-07')::DATE, true),
        ('Nossa Senhora Aparecida', (v_year || '-10-12')::DATE, (v_year || '-10-12')::DATE, true),
        ('Finados', (v_year || '-11-02')::DATE, (v_year || '-11-02')::DATE, true),
        ('Proclamação da República', (v_year || '-11-15')::DATE, (v_year || '-11-15')::DATE, true),
        ('Dia da Consciência Negra', (v_year || '-11-20')::DATE, (v_year || '-11-20')::DATE, true),
        ('Natal', (v_year || '-12-25')::DATE, (v_year || '-12-25')::DATE, true);

        -- MOVABLE HOLIDAYS
        v_easter := public.calculate_easter(v_year);
        
        -- Carnaval (Tuesday is the holiday, but usually Monday is also included as optional)
        -- We will add Monday and Tuesday
        INSERT INTO public.holidays (name, start_date, end_date, is_national) VALUES
        ('Carnaval', v_easter - 48, v_easter - 47, true);

        -- Sexta-feira Santa
        INSERT INTO public.holidays (name, start_date, end_date, is_national) VALUES
        ('Sexta-feira Santa', v_easter - 2, v_easter - 2, true);

        -- Corpus Christi
        INSERT INTO public.holidays (name, start_date, end_date, is_national) VALUES
        ('Corpus Christi', v_easter + 60, v_easter + 60, true);

    END LOOP;
END $$;

-- Cleanup function
DROP FUNCTION public.calculate_easter(INTEGER);
