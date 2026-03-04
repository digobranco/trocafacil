'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ServiceProfessional = {
    id: string
    professionalId: string
    professionalName: string
    professionalSpecialty: string | null
    customPrice: number | null
    customDuration: number | null
    isActive: boolean
}

export type ProfessionalConfig = {
    professionalId: string
    customPrice?: number | null
    customDuration?: number | null
}

/**
 * Get all professionals linked to a service with their configurations
 */
export async function getServiceProfessionals(serviceId: string): Promise<ServiceProfessional[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('professional_services')
        .select(`
            id,
            professional_id,
            custom_price,
            custom_duration_minutes,
            is_active,
            professionals (
                id,
                name,
                specialty
            )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching service professionals:', error)
        throw new Error('Failed to fetch service professionals')
    }

    return (data || []).map(ps => {
        const prof = ps.professionals as unknown as { id: string; name: string; specialty: string | null }
        return {
            id: ps.id,
            professionalId: ps.professional_id,
            professionalName: prof.name,
            professionalSpecialty: prof.specialty,
            customPrice: ps.custom_price,
            customDuration: ps.custom_duration_minutes,
            isActive: ps.is_active
        }
    })
}

/**
 * Get all professionals available for a service (for configuration page)
 */
export async function getAllProfessionalsForConfiguration(serviceId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')

    // Get all professionals from tenant
    const { data: professionals, error: profsError } = await supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('active', true)
        .order('name')

    if (profsError) {
        console.error('Error fetching professionals:', profsError)
        throw new Error('Failed to fetch professionals')
    }

    // Get service's current links
    const { data: professionalServices, error: psError } = await supabase
        .from('professional_services')
        .select('professional_id, custom_price, custom_duration_minutes')
        .eq('service_id', serviceId)

    if (psError) {
        console.error('Error fetching professional services:', psError)
        throw new Error('Failed to fetch professional services')
    }

    const psMap = new Map(
        (professionalServices || []).map(ps => [ps.professional_id, ps])
    )

    return (professionals || []).map(prof => ({
        id: prof.id,
        name: prof.name,
        specialty: prof.specialty,
        isLinked: psMap.has(prof.id),
        customPrice: psMap.get(prof.id)?.custom_price || null,
        customDuration: psMap.get(prof.id)?.custom_duration_minutes || null
    }))
}

/**
 * Update service professionals configuration
 */
export async function updateServiceProfessionals(
    serviceId: string,
    professionals: ProfessionalConfig[]
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')
    if (profile.role !== 'admin') throw new Error('Only admins can manage service professionals')

    // First, remove all existing links for this service
    const { error: deleteError } = await supabase
        .from('professional_services')
        .delete()
        .eq('service_id', serviceId)

    if (deleteError) {
        console.error('Error deleting professional services:', deleteError)
        return { error: 'Failed to update professional services' }
    }

    // Then insert new links
    if (professionals.length > 0) {
        const insertData = professionals.map(p => ({
            tenant_id: profile.tenant_id,
            service_id: serviceId,
            professional_id: p.professionalId,
            custom_price: p.customPrice || null,
            custom_duration_minutes: p.customDuration || null,
            is_active: true
        }))

        const { error: insertError } = await supabase
            .from('professional_services')
            .insert(insertData)

        if (insertError) {
            console.error('Error inserting professional services:', insertError)
            return { error: 'Failed to update professional services' }
        }
    }

    revalidatePath(`/dashboard/servicos/${serviceId}/profissionais`)
    revalidatePath(`/dashboard/profissionais`)
    revalidatePath('/dashboard/agenda')

    return { success: true }
}
