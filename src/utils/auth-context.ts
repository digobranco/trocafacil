'use server'

import { createClient } from '@/utils/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export interface AuthContext {
    supabase: SupabaseClient
    userId: string
    tenantId: string
    role: string
    profile: any
    identityId: string | null // customer_id or professional_id
}

/**
 * Consolidated auth helper — performs authentication, profile lookup and
 * identity resolution in a single call with minimal DB queries.
 * All server actions should use this instead of repeating auth logic.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return null

    // Resolve identity (customer_id or professional_id) based on role
    let identityId: string | null = null
    if (profile.role === 'customer') {
        const { data } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
        identityId = data?.id || null
    } else if (profile.role === 'professional' || profile.role === 'admin') {
        const { data } = await supabase
            .from('professionals')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
        identityId = data?.id || null
    }

    return {
        supabase,
        userId: user.id,
        tenantId: profile.tenant_id,
        role: profile.role,
        profile: { ...profile, customer_id: profile.role === 'customer' ? identityId : undefined, professional_id: ['professional', 'admin'].includes(profile.role) ? identityId : undefined },
        identityId
    }
}
