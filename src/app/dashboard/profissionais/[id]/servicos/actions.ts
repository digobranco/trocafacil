'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ProfessionalService = {
    id: string
    serviceId: string
    serviceName: string
    serviceDescription: string | null
    defaultPrice: number | null
    defaultDuration: number
    customPrice: number | null
    customDuration: number | null
    isActive: boolean
}

export type ServiceConfig = {
    serviceId: string
    customPrice?: number | null
    customDuration?: number | null
}

/**
 * Get all services linked to a professional with their configurations
 */
export async function getProfessionalServices(professionalId: string): Promise<ProfessionalService[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get professional's services with details
    const { data, error } = await supabase
        .from('professional_services')
        .select(`
      id,
      service_id,
      custom_price,
      custom_duration_minutes,
      is_active,
      services (
        id,
        name,
        description,
        price,
        duration_minutes
      )
    `)
        .eq('professional_id', professionalId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching professional services:', error)
        throw new Error('Failed to fetch professional services')
    }

    return (data || []).map(ps => {
        const service = ps.services as unknown as { id: string; name: string; description: string | null; price: number | null; duration_minutes: number }
        return {
            id: ps.id,
            serviceId: ps.service_id,
            serviceName: service.name,
            serviceDescription: service.description,
            defaultPrice: service.price,
            defaultDuration: service.duration_minutes,
            customPrice: ps.custom_price,
            customDuration: ps.custom_duration_minutes,
            isActive: ps.is_active
        }
    })
}

/**
 * Get all services available for a professional (for configuration page)
 */
export async function getAllServicesForConfiguration(professionalId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user's tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')

    // Get all services from tenant
    const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('active', true)
        .order('name')

    if (servicesError) {
        console.error('Error fetching services:', servicesError)
        throw new Error('Failed to fetch services')
    }

    // Get professional's current links
    const { data: professionalServices, error: psError } = await supabase
        .from('professional_services')
        .select('service_id, custom_price, custom_duration_minutes')
        .eq('professional_id', professionalId)

    if (psError) {
        console.error('Error fetching professional services:', psError)
        throw new Error('Failed to fetch professional services')
    }

    // Map to create a complete view
    const psMap = new Map(
        (professionalServices || []).map(ps => [ps.service_id, ps])
    )

    return (services || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.duration_minutes,
        isLinked: psMap.has(service.id),
        customPrice: psMap.get(service.id)?.custom_price || null,
        customDuration: psMap.get(service.id)?.custom_duration_minutes || null
    }))
}

/**
 * Update professional services configuration
 */
export async function updateProfessionalServices(
    professionalId: string,
    services: ServiceConfig[]
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user's tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')
    if (profile.role !== 'admin') throw new Error('Only admins can manage professional services')

    // First, remove all existing links for this professional
    const { error: deleteError } = await supabase
        .from('professional_services')
        .delete()
        .eq('professional_id', professionalId)

    if (deleteError) {
        console.error('Error deleting professional services:', deleteError)
        return { error: 'Failed to update professional services' }
    }

    // Then insert new links
    if (services.length > 0) {
        const insertData = services.map(s => ({
            tenant_id: profile.tenant_id,
            professional_id: professionalId,
            service_id: s.serviceId,
            custom_price: s.customPrice || null,
            custom_duration_minutes: s.customDuration || null,
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

    revalidatePath(`/dashboard/profissionais/${professionalId}/servicos`)
    revalidatePath('/dashboard/agenda')

    return { success: true }
}

/**
 * Get available services for a professional (for appointment booking)
 */
export async function getAvailableServices(professionalId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('professional_services')
        .select(`
      service_id,
      custom_price,
      custom_duration_minutes,
      services (
        id,
        name,
        description,
        price,
        duration_minutes
      )
    `)
        .eq('professional_id', professionalId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching available services:', error)
        throw new Error('Failed to fetch available services')
    }

    return (data || []).map(ps => {
        const service = ps.services as unknown as { id: string; name: string; description: string | null; price: number | null; duration_minutes: number }
        return {
            id: service.id,
            name: service.name,
            description: service.description,
            price: ps.custom_price ?? service.price,
            durationMinutes: ps.custom_duration_minutes ?? service.duration_minutes
        }
    })
}
