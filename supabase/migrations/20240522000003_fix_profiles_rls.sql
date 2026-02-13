-- Permitir que usuários visualizem seu próprio perfil
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Permitir que usuários atualizem seu próprio perfil (necessário para vincular o tenant_id)
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
