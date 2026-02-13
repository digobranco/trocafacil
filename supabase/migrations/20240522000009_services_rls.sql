-- Enable RLS for services (already enabled in init, but good to ensure)
alter table public.services enable row level security;

-- Policy for reading services (Authenticated users can read services from their tenant)
create policy "Users can view tenant services" on public.services
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = public.services.tenant_id
    )
  );

-- Policy for managing services (Admins and Professionals can insert/update/delete)
create policy "Admins/Pros can manage services" on public.services
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'professional')
      and profiles.tenant_id = public.services.tenant_id
    )
  );
