-- 1. Função para obter o tenant_id do usuário atual de forma segura (Security Definer)
create or replace function public.get_auth_tenant_id()
returns uuid as $$
declare
  t_id uuid;
begin
  select tenant_id into t_id from public.profiles where id = auth.uid();
  return t_id;
end;
$$ language plpgsql security definer;

-- 2. Função para obter o role do usuário atual de forma segura (Security Definer)
create or replace function public.get_auth_role()
returns text as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return user_role;
end;
$$ language plpgsql security definer;

-- 3. Limpar políticas antigas que podem causar conflito ou insegurança
drop policy if exists "Staff can view profiles of their tenant" on public.profiles;

-- 4. Criar política de visualização segura
-- Permite que administradores e profissionais vejam perfis do mesmo tenant
create policy "Staff can view profiles of their tenant" on public.profiles
  for select using (
    tenant_id = public.get_auth_tenant_id()
    and public.get_auth_role() in ('admin', 'professional')
  );

-- 5. Garantir que o próprio usuário sempre veja seu perfil (redundante mas seguro)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- 6. Garantir que super_admins continuem vendo tudo
drop policy if exists "Super Admins can view all profiles" on public.profiles;
create policy "Super Admins can view all profiles" on public.profiles
  for select using (public.get_auth_role() = 'super_admin');
