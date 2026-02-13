-- Permitir que Admins editem perfis de clientes do MESMO tenant
create policy "Admins can update their tenant customers" on public.profiles
  for update using (
    -- O usuário logado deve ser Admin E estar no mesmo tenant do perfil alvo
    exists (
      select 1 from public.profiles as mine
      where mine.id = auth.uid()
      and mine.role = 'admin'
      and mine.tenant_id = public.profiles.tenant_id
    )
  );
