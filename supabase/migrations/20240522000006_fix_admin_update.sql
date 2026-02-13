-- Adicionar permissão de UPDATE para Super Admin na tabela profiles
create policy "Super Admins can update all profiles" on public.profiles
  for update using (
    public.is_super_admin()
  );
