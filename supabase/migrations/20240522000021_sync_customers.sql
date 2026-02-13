-- Migration/Script: 20240522000021_sync_customers.sql
-- Goal: Ensure all profiles with role 'customer' and a tenant_id have a record in the customers table

INSERT INTO public.customers (tenant_id, profile_id, full_name, phone, email)
SELECT 
    tenant_id, 
    id as profile_id, 
    COALESCE(full_name, 'Cliente Migrado'), 
    phone, 
    email
FROM public.profiles
WHERE role = 'customer' 
  AND tenant_id IS NOT NULL
  AND id NOT IN (SELECT profile_id FROM public.customers WHERE profile_id IS NOT NULL);
