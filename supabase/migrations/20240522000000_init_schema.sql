-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tenants (Empresas/Clínicas)
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles (Usuários vinculados ao Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  phone text,
  role text default 'customer' check (role in ('admin', 'professional', 'customer')),
  tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services (Serviços oferecidos)
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes integer not null,
  price decimal(10,2),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules (Disponibilidade base do Profissional)
create table public.schedules (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Dom, 6=Sab
  start_time time not null,
  end_time time not null,
  is_active boolean default true
);

-- Appointments (Agendamentos)
create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  professional_id uuid references public.profiles(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  type text default 'single' check (type in ('single', 'recurring', 'replacement')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Credits (Créditos de Reposição)
create table public.credits (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  quantity integer default 0,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.credits enable row level security;

-- Policy: Public read for tenants (for subdomain resolve, etc)
create policy "Public tenants are viewable by everyone" on public.tenants for select using (true);

-- Functions
-- Function to handle new user signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
