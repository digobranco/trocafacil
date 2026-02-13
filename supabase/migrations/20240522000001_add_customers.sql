-- Customers (Carteira de Clientes do Tenant)
-- Separado de 'profiles' para permitir cadastro sem login imediato
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  active boolean default true,
  profile_id uuid references public.profiles(id) on delete set null, -- Link opcional se o user criar conta
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.customers enable row level security;

-- Policies
-- Profissionais do mesmo tenant podem ver/editar
create policy "Users can view customers of their tenant" on public.customers
  for select using (
    tenant_id in (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can insert customers for their tenant" on public.customers
  for insert with check (
    tenant_id in (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update customers of their tenant" on public.customers
  for update using (
    tenant_id in (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );
