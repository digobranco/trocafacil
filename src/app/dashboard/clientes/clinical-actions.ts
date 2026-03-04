'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'

export async function saveAnamnesis(customerId: string, content: any) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role === 'customer') throw new Error('Forbidden')

    const { error } = await ctx.supabase
        .from('anamnesis')
        .upsert({
            tenant_id: ctx.tenantId,
            client_id: customerId,
            content,
            updated_at: new Date().toISOString()
        }, { onConflict: 'client_id' })

    if (error) {
        console.error('Error saving anamnesis:', error)
        return { error: 'Falha ao salvar anamnese.' }
    }

    revalidatePath(`/dashboard/clientes/${customerId}`)
    return { success: true }
}

export async function addEvolution(customerId: string, content: string, appointmentId?: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role === 'customer') throw new Error('Forbidden')

    const { error } = await ctx.supabase
        .from('evolutions')
        .insert({
            tenant_id: ctx.tenantId,
            client_id: customerId,
            professional_id: ctx.userId,
            appointment_id: appointmentId,
            content
        })

    if (error) {
        console.error('Error adding evolution:', error)
        return { error: 'Falha ao adicionar evolução.' }
    }

    revalidatePath(`/dashboard/clientes/${customerId}`)
    return { success: true }
}

export async function saveBatchEvolutions(evolutions: { clientId: string, appointmentId: string, content: string }[]) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role === 'customer') throw new Error('Forbidden')

    const records = evolutions.map(ev => ({
        tenant_id: ctx.tenantId,
        client_id: ev.clientId,
        professional_id: ctx.userId,
        appointment_id: ev.appointmentId,
        content: ev.content
    }))

    const { error } = await ctx.supabase
        .from('evolutions')
        .insert(records)

    if (error) {
        console.error('Error adding batch evolutions:', error)
        return { error: 'Falha ao salvar evoluções em lote.' }
    }

    return { success: true }
}

export async function getClinicalDetails(customerId: string) {
    const ctx = await getAuthContext()
    if (!ctx || ctx.role === 'customer') return null

    // Fetch anamnesis, evolutions, and templates in PARALLEL
    const [anamnesisRes, evolutionsRes, templatesRes] = await Promise.all([
        ctx.supabase.from('anamnesis').select('*').eq('client_id', customerId).maybeSingle(),
        ctx.supabase.from('evolutions')
            .select(`
                *,
                professional:profiles(full_name)
            `)
            .eq('client_id', customerId)
            .order('created_at', { ascending: false }),
        ctx.supabase.from('anamnesis_templates')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
    ])

    return {
        anamnesis: anamnesisRes.data,
        evolutions: evolutionsRes.data || [],
        templates: templatesRes.data || []
    }
}
