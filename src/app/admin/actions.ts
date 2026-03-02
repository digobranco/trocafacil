'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function checkSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') throw new Error('Unauthorized')

    return supabase
}

export async function createTenantByAdmin(formData: FormData) {
    const supabase = await checkSuperAdmin()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string

    const { data, error } = await supabase
        .from('tenants')
        .insert({ name, slug })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return { error: 'Slug já existe.' }
        }
        return { error: 'Erro ao criar tenant.' }
    }

    revalidatePath('/admin/tenants')
    return { success: true }
}

export async function assignUserToTenant(userId: string, tenantId: string, role: 'admin' | 'professional' | 'customer') {
    const supabase = await checkSuperAdmin()

    const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId, role })
        .eq('id', userId)

    if (error) {
        console.error('Assign User Error:', error)
        return { error: `Erro ao vincular usuário: ${error.message}` }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateTenantByAdmin(tenantId: string, formData: FormData) {
    const supabase = await checkSuperAdmin()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const invite_code = formData.get('invite_code') as string
    const admin_invite_code = formData.get('admin_invite_code') as string
    const plan = formData.get('plan') as string
    const is_active = formData.get('is_active') === 'on'

    const { error } = await supabase
        .from('tenants')
        .update({
            name,
            slug,
            invite_code,
            admin_invite_code,
            plan,
            is_active
        })
        .eq('id', tenantId)

    if (error) {
        console.error('Update Tenant Error:', error)
        return { error: `Erro ao atualizar empresa: ${error.message}` }
    }

    revalidatePath('/admin/tenants')
    revalidatePath(`/admin/tenants/${tenantId}`)
    return { success: true }
}

export async function startImpersonation(tenantId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'Sem permissão.' }

    // Verify tenant exists
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('id', tenantId)
        .single()

    if (error || !tenant) {
        return { error: 'Tenant não encontrado.' }
    }

    const { setImpersonatingTenantId } = await import('@/utils/impersonation')
    await setImpersonatingTenantId(tenant.id)

    return { success: true, redirectTo: '/dashboard' }
}

export async function stopImpersonation() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'Sem permissão.' }

    const { clearImpersonation } = await import('@/utils/impersonation')
    await clearImpersonation()

    return { success: true, redirectTo: '/admin' }
}

