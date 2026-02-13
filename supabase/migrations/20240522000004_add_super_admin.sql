-- Adicionar 'super_admin' nas constraints de role
alter table public.profiles 
  drop constraint profiles_role_check;

alter table public.profiles 
  add constraint profiles_role_check 
  check (role in ('super_admin', 'admin', 'professional', 'customer'));

-- Políticas para Super Admin
-- Super Admin pode ver e editar todos os tenants
create policy "Super Admins can do everything on tenants" on public.tenants
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- Super Admin pode ver todos os profiles
create policy "Super Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );
