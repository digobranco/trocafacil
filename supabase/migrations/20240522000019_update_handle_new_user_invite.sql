-- Update handle_new_user to support phone number and invite_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tenant_id uuid;
  v_invite_code text;
BEGIN
  v_invite_code := new.raw_user_meta_data->>'invite_code';
  
  -- If invite code is provided, try to find the tenant
  IF v_invite_code IS NOT NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE invite_code = v_invite_code AND is_active = true LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, role, tenant_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    new.raw_user_meta_data->>'phone',
    'customer',
    v_tenant_id
  );
  
  -- Also create a customer record if linked to a tenant
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.customers (tenant_id, full_name, phone, email, profile_id)
    VALUES (
      v_tenant_id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
      new.raw_user_meta_data->>'phone',
      new.email,
      new.id
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
