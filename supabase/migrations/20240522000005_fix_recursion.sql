-- Drop policy que causa recursão
drop policy if exists "Super Admins can view all profiles" on public.profiles;
drop policy if exists "Super Admins can do everything on tenants" on public.tenants;

-- Função helper para verificar super_admin sem disparar RLS (Security Definer)
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

-- Recriar policy de profiles usando a função
create policy "Super Admins can view all profiles" on public.profiles
  for select using (
    public.is_super_admin()
  );

-- Recriar policy de tenants usando a função
create policy "Super Admins can do everything on tenants" on public.tenants
  for all using (
    public.is_super_admin()
  );
