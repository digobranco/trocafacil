-- RLS Policies for Appointments

-- Policy for reading appointments (Users can see their own or their tenant's)
create policy "Users can view their tenant appointments" on public.appointments
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = public.appointments.tenant_id
    )
  );

-- Policy for inserting appointments (Admins and Professionals can create)
create policy "Admins/Pros can create appointments" on public.appointments
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'professional')
      and profiles.tenant_id = public.appointments.tenant_id
    )
  );

-- Policy for updating appointments (Admins and Professionals can update their tenant's)
create policy "Admins/Pros can update appointments" on public.appointments
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'professional')
      and profiles.tenant_id = public.appointments.tenant_id
    )
  );

-- Policy for deleting appointments
create policy "Admins/Pros can delete appointments" on public.appointments
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'professional')
      and profiles.tenant_id = public.appointments.tenant_id
    )
  );
