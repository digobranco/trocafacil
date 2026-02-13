import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function checkRole(allowedRoles: ('admin' | 'professional' | 'customer' | 'super_admin')[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !allowedRoles.includes(profile.role as any)) {
        redirect('/dashboard') // Back to safety
    }

    return profile
}
