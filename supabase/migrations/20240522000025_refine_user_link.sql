-- Refine handle_new_user to link existing customers by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tenant_id uuid;
  v_invite_code text;
  v_existing_customer_id uuid;
BEGIN
  v_invite_code := new.raw_user_meta_data->>'invite_code';
  
  -- If invite code is provided, try to find the tenant
  IF v_invite_code IS NOT NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE invite_code = v_invite_code AND is_active = true LIMIT 1;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone, role, tenant_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    new.raw_user_meta_data->>'phone',
    'customer',
    v_tenant_id
  );
  
  -- Logic for linking or creating customer record
  IF v_tenant_id IS NOT NULL THEN
    -- Check if a customer with this email already exists in THIS tenant
    SELECT id INTO v_existing_customer_id 
    FROM public.customers 
    WHERE email = new.email AND tenant_id = v_tenant_id AND profile_id IS NULL
    LIMIT 1;

    IF v_existing_customer_id IS NOT NULL THEN
      -- Link existing customer to the new profile
      UPDATE public.customers 
      SET profile_id = new.id,
          full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone)
      WHERE id = v_existing_customer_id;
    ELSE
      -- Create new customer record
      INSERT INTO public.customers (tenant_id, full_name, phone, email, profile_id)
      VALUES (
        v_tenant_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        new.raw_user_meta_data->>'phone',
        new.email,
        new.id
      );
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
