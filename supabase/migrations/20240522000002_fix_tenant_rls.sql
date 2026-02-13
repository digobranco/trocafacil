-- Permitir que qualquer usuário autenticado crie um tenant
create policy "Authenticated users can insert tenants" on public.tenants
  for insert with check (auth.role() = 'authenticated');

-- Permitir update se for o dono (admin no profile e tenant_id bate)
create policy "Admins can update their tenant" on public.tenants
  for update using (
    id in (
      select tenant_id from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );
