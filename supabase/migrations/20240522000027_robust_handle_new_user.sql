-- Refine handle_new_user to be more robust with trimming and unified logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_input_code text;
  v_tenant_id uuid;
  v_role text := 'customer';
  v_existing_customer_id uuid;
BEGIN
  -- Extract and trim code from metadata
  v_input_code := trim(new.raw_user_meta_data->>'invite_code');
  
  -- If code is provided, try to find tenant and determine role in a single step
  IF v_input_code IS NOT NULL AND v_input_code != '' THEN
    SELECT id, 
           CASE WHEN admin_invite_code = v_input_code THEN 'admin' ELSE 'customer' END
    INTO v_tenant_id, v_role
    FROM public.tenants 
    WHERE (invite_code = v_input_code OR admin_invite_code = v_input_code)
      AND is_active = true
    LIMIT 1;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone, role, tenant_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    new.raw_user_meta_data->>'phone',
    v_role,
    v_tenant_id
  );
  
  -- Logic for linking or creating customer record (ONLY if role is customer)
  IF v_tenant_id IS NOT NULL AND v_role = 'customer' THEN
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
