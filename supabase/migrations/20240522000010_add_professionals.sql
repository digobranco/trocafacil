-- Professionals (Equipe do Tenant)
-- Separado de 'profiles' para permitir cadastro administrativo sem login imediato
create table public.professionals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  specialty text,
  bio text,
  active boolean default true,
  profile_id uuid references public.profiles(id) on delete set null, -- Link opcional se o user criar conta
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.professionals enable row level security;

-- Policies
-- Admins e Profissionais do mesmo tenant podem ver
create policy "Users can view professionals of their tenant" on public.professionals
  for select using (
    tenant_id in (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- Apenas Admins podem criar/atualizar/deletar profissionais
create policy "Admins can manage professionals" on public.professionals
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and profiles.tenant_id = public.professionals.tenant_id
    )
  );
