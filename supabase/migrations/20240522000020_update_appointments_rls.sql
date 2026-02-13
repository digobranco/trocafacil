-- Migration: 20240522000020_update_appointments_rls.sql
-- Goal: Allow customers to create and delete their own appointments correctly

-- Drop existing restricted policies
drop policy if exists "Users can create appointments" on public.appointments;
drop policy if exists "Users can update appointments" on public.appointments;
drop policy if exists "Users can delete appointments" on public.appointments;
drop policy if exists "Admins/Pros can create appointments" on public.appointments;
drop policy if exists "Admins/Pros can delete appointments" on public.appointments;
drop policy if exists "Admins/Pros can update appointments" on public.appointments;

-- 1. Insert Policy
create policy "Users can create appointments" on public.appointments
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = public.appointments.tenant_id
      and (
        profiles.role in ('admin', 'professional')
        or (
          profiles.role = 'customer' 
          and public.appointments.client_id in (
            select id from public.customers where profile_id = auth.uid()
          )
        )
      )
    )
  );

-- 2. Update Policy
create policy "Users can update appointments" on public.appointments
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = public.appointments.tenant_id
      and (
        profiles.role in ('admin', 'professional')
        or (
          profiles.role = 'customer' 
          and public.appointments.client_id in (
            select id from public.customers where profile_id = auth.uid()
          )
        )
      )
    )
  );

-- 3. Delete Policy
create policy "Users can delete appointments" on public.appointments
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = public.appointments.tenant_id
      and (
        profiles.role in ('admin', 'professional')
        or (
          profiles.role = 'customer' 
          and public.appointments.client_id in (
            select id from public.customers where profile_id = auth.uid()
          )
        )
      )
    )
  );
