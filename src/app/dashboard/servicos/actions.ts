'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createService(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Get user's tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        throw new Error('No tenant found')
    }

    const name = formData.get('name') as string
    const duration = parseInt(formData.get('duration') as string)
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('services')
        .insert({
            tenant_id: profile.tenant_id,
            name,
            duration_minutes: duration,
            price,
            description,
            active: true
        })

    if (error) {
        console.error('Error creating service:', error)
        return { error: 'Failed to create service' }
    }

    revalidatePath('/dashboard/servicos')
    return { success: true }
}

export async function updateService(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const duration = parseInt(formData.get('duration') as string)
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string

    // Validate ownership
    const { data: service } = await supabase
        .from('services')
        .select('tenant_id')
        .eq('id', id)
        .single()

    // Check if user belongs to the same tenant (re-using profile check to be safe, or just relying on RLS if enabled. 
    // RLS "Admins/Pros can manage services" checks tenant_id match. 
    // So simple update should work if RLS is effectively applied.
    // However, explicit check is good.

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile || service?.tenant_id !== profile.tenant_id) {
        return { error: 'Unauthorized or Service not found' }
    }

    const { error } = await supabase
        .from('services')
        .update({
            name,
            duration_minutes: duration,
            price,
            description
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating service:', error)
        return { error: 'Failed' }
    }

    revalidatePath('/dashboard/servicos')
    return { success: true }
}

export async function deleteService(serviceId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('services').delete().eq('id', serviceId)

    if (error) {
        console.error('Error deleting:', error)
        return { error: 'Failed to delete' }
    }
    revalidatePath('/dashboard/servicos')
}
