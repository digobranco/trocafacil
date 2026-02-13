'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createProfessional(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const specialty = formData.get('specialty') as string
    const bio = formData.get('bio') as string

    const { error } = await supabase
        .from('professionals')
        .insert({
            tenant_id: profile.tenant_id,
            name,
            email,
            phone,
            specialty,
            bio,
            active: true
        })

    if (error) {
        console.error('Error creating professional:', error)
        return { error: 'Falha ao criar profissional.' }
    }

    revalidatePath('/dashboard/profissionais')
    return { success: true }
}

export async function updateProfessional(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const specialty = formData.get('specialty') as string
    const bio = formData.get('bio') as string

    // Check permission (Admin) - RLS handles it, but good to have check?
    // RLS "Admins can manage professionals" ensures this.

    const { error } = await supabase
        .from('professionals')
        .update({
            name,
            email,
            phone,
            specialty,
            bio
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating professional:', error)
        return { error: 'Falha ao atualizar profissional.' }
    }

    revalidatePath('/dashboard/profissionais')
    return { success: true }
}

export async function toggleProfessionalStatus(id: string, active: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('professionals')
        .update({ active })
        .eq('id', id)

    if (error) {
        console.error('Error updating status:', error)
        return { error: 'Falha ao atualizar status.' }
    }
    revalidatePath('/dashboard/profissionais')
    return { success: true }
}
