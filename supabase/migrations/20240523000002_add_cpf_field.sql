-- Add CPF field to profiles, customers and professionals
alter table public.profiles add column if not exists cpf text;
alter table public.customers add column if not exists cpf text;
alter table public.professionals add column if not exists cpf text;

-- Update handle_new_user function to include CPF and preserve professional logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_input_code text;
  v_tenant_id uuid;
  v_role text := 'customer';
  v_existing_customer_id uuid;
  v_existing_professional_id uuid;
  v_clean_cpf text;
BEGIN
  -- Extract and trim code from metadata
  v_input_code := trim(new.raw_user_meta_data->>'invite_code');
  v_clean_cpf := regexp_replace(new.raw_user_meta_data->>'cpf', '\D', '', 'g');
  
  -- If code is provided, try to find tenant and determine role
  IF v_input_code IS NOT NULL AND v_input_code != '' THEN
    SELECT id, 
           CASE 
             WHEN admin_invite_code = v_input_code THEN 'admin' 
             WHEN professional_invite_code = v_input_code THEN 'professional'
             ELSE 'customer' 
           END
    INTO v_tenant_id, v_role
    FROM public.tenants 
    WHERE (invite_code = v_input_code OR admin_invite_code = v_input_code OR professional_invite_code = v_input_code)
      AND is_active = true
    LIMIT 1;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone, role, tenant_id, cpf)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    new.raw_user_meta_data->>'phone',
    v_role,
    v_tenant_id,
    v_clean_cpf
  );
  
  -- Case 1: Customer Link
  IF v_tenant_id IS NOT NULL AND v_role = 'customer' THEN
    SELECT id INTO v_existing_customer_id 
    FROM public.customers 
    WHERE email = new.email AND tenant_id = v_tenant_id AND profile_id IS NULL
    LIMIT 1;

    IF v_existing_customer_id IS NOT NULL THEN
      -- Link existing customer to the new profile
      UPDATE public.customers 
      SET profile_id = new.id,
          full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
          cpf = COALESCE(v_clean_cpf, cpf)
      WHERE id = v_existing_customer_id;
    ELSE
      -- Create new customer record
      INSERT INTO public.customers (tenant_id, full_name, phone, email, profile_id, cpf)
      VALUES (
        v_tenant_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        new.raw_user_meta_data->>'phone',
        new.email,
        new.id,
        v_clean_cpf
      );
    END IF;
  
  -- Case 2: Professional Link
  ELSIF v_tenant_id IS NOT NULL AND v_role = 'professional' THEN
    -- Check if a professional with this email already exists in THIS tenant
    SELECT id INTO v_existing_professional_id 
    FROM public.professionals 
    WHERE email = new.email AND tenant_id = v_tenant_id AND profile_id IS NULL
    LIMIT 1;

    IF v_existing_professional_id IS NOT NULL THEN
      -- Link existing professional to the new profile
      UPDATE public.professionals 
      SET profile_id = new.id,
          name = COALESCE(new.raw_user_meta_data->>'full_name', name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
          cpf = COALESCE(v_clean_cpf, cpf)
      WHERE id = v_existing_professional_id;
    ELSE
      -- Create new professional record
      INSERT INTO public.professionals (tenant_id, name, phone, email, profile_id, active, cpf)
      VALUES (
        v_tenant_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Profissional'),
        new.raw_user_meta_data->>'phone',
        new.email,
        new.id,
        true,
        v_clean_cpf
      );
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

