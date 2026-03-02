import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getImpersonatingTenantId } from '@/utils/impersonation'

export async function checkRole(allowedRoles: ('admin' | 'professional' | 'customer' | 'super_admin')[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/dashboard')
    }

    // Super admin impersonating: treat as having the required role
    if (profile.role === 'super_admin') {
        const impersonatingTenantId = await getImpersonatingTenantId()
        if (impersonatingTenantId) {
            return { role: 'admin', tenant_id: impersonatingTenantId }
        }
        // Super admin not impersonating — check if super_admin is in allowed roles
        if (!allowedRoles.includes('super_admin')) {
            redirect('/dashboard')
        }
        return profile
    }

    if (!allowedRoles.includes(profile.role as any)) {
        redirect('/dashboard') // Back to safety
    }

    return profile
}

