-- 1. Habilitar RLS para Schedules (já habilitado, mas reforçando policies)
-- Permitir SELECT para todos autenticados (para ver disponibilidade)
create policy "Schedules are viewable by authenticated users" on public.schedules
  for select using (auth.role() = 'authenticated');

-- Permitir INSERT/UPDATE/DELETE apenas para o próprio profissional ou Admin do Tenant
create policy "Professionals can manage own schedules" on public.schedules
  for all using (
    auth.uid() = professional_id 
    or 
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and tenant_id = public.schedules.tenant_id 
      and role in ('admin', 'super_admin')
    )
  );

-- O schema original NÃO tem constraint UNIQUE(professional_id, day_of_week),
-- então múltiplos slots já são tecnicamente possíveis no banco.
-- Vamos apenas garantir que o RLS funcione.
