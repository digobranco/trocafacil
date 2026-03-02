-- Migration: Super Admin Impersonation RLS
-- Purpose: Allow super_admin to read AND write data from any tenant
-- for support impersonation feature.
-- Uses the existing is_super_admin() security definer function.

-- services
CREATE POLICY "Super Admins can access all services" ON public.services
  FOR ALL USING (public.is_super_admin());

-- customers
CREATE POLICY "Super Admins can access all customers" ON public.customers
  FOR ALL USING (public.is_super_admin());

-- schedules
CREATE POLICY "Super Admins can access all schedules" ON public.schedules
  FOR ALL USING (public.is_super_admin());

-- appointments
CREATE POLICY "Super Admins can access all appointments" ON public.appointments
  FOR ALL USING (public.is_super_admin());

-- credits
CREATE POLICY "Super Admins can access all credits" ON public.credits
  FOR ALL USING (public.is_super_admin());

-- professionals
CREATE POLICY "Super Admins can access all professionals" ON public.professionals
  FOR ALL USING (public.is_super_admin());

-- credit_logs
CREATE POLICY "Super Admins can access all credit_logs" ON public.credit_logs
  FOR ALL USING (public.is_super_admin());

-- anamnesis
CREATE POLICY "Super Admins can access all anamnesis" ON public.anamnesis
  FOR ALL USING (public.is_super_admin());

-- evolutions
CREATE POLICY "Super Admins can access all evolutions" ON public.evolutions
  FOR ALL USING (public.is_super_admin());

-- professional_services
CREATE POLICY "Super Admins can access all professional_services" ON public.professional_services
  FOR ALL USING (public.is_super_admin());

-- membership_plans
CREATE POLICY "Super Admins can access all membership_plans" ON public.membership_plans
  FOR ALL USING (public.is_super_admin());

-- client_memberships
CREATE POLICY "Super Admins can access all client_memberships" ON public.client_memberships
  FOR ALL USING (public.is_super_admin());
