
'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'

export async function updateCustomer(formData: FormData) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '')
    const notes = formData.get('notes') as string
    const active = formData.get('active') === 'true'

    if (!id || !name || !phone) {
        return { error: 'Nome e telefone são obrigatórios.' }
    }

    const { error } = await ctx.supabase
        .from('customers')
        .update({
            full_name: name,
            phone,
            email,
            cpf,
            notes,
            active
        })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error updating customer:', error)
        return { error: 'Falha ao atualizar cliente. Verifique se você tem permissão.' }
    }

    revalidatePath('/dashboard/clientes')
    return { success: true }
}


export async function createCustomer(formData: FormData) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '')
    const notes = formData.get('notes') as string

    const { error } = await ctx.supabase
        .from('customers')
        .insert({
            tenant_id: ctx.tenantId,
            full_name: name,
            phone,
            email,
            cpf,
            notes,
            active: true
        })

    if (error) {
        console.error('Error creating customer:', error)
        return { error: 'Failed' }
    }

    revalidatePath('/dashboard/clientes')
    return { success: true }
}

export async function getCustomerDetails(id: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (!id || id === 'undefined') return null

    // Get customer and current credits
    const { data: customer, error } = await ctx.supabase
        .from('customers')
        .select(`
            *,
            credits(id, quantity, service_restrictions, membership_plan_id, plan:membership_plan_id(name))
        `)
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)
        .maybeSingle()

    if (error || !customer) {
        console.error('Error fetching customer details:', JSON.stringify(error, null, 2))
        return null
    }

    // Attempt to fetch profile details separately if linked
    if (customer.profile_id) {
        const { data: linkedProfile } = await ctx.supabase
            .from('profiles')
            .select('full_name, email, phone, role, created_at')
            .eq('id', customer.profile_id)
            .maybeSingle()

        if (linkedProfile) {
            customer.linked_profile = linkedProfile
        }
    }

    return customer
}

export async function adjustCustomerCredits(customerId: string, delta: number) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    // 1. Get current credit record or create if not exists
    const { data: creditRecord } = await ctx.supabase
        .from('credits')
        .select('id, quantity')
        .eq('client_id', customerId)
        .eq('tenant_id', ctx.tenantId)
        .is('membership_plan_id', null) // Adjust "General" credits by default
        .maybeSingle()

    if (creditRecord) {
        const newQuantity = Math.max(0, creditRecord.quantity + delta)
        const { error } = await ctx.supabase
            .from('credits')
            .update({ quantity: newQuantity })
            .eq('id', creditRecord.id)

        if (error) {
            console.error('Error updating credits:', error)
            return { error: 'Erro ao atualizar créditos.' }
        }

        // Insert log
        await ctx.supabase.from('credit_logs').insert({
            tenant_id: ctx.tenantId,
            client_id: customerId,
            quantity_change: delta,
            type: 'manual_adjustment',
            notes: delta > 0 ? 'Adição manual via painel' : 'Remoção manual via painel'
        })
    } else {
        if (delta < 0) return { error: 'Saldo insuficiente para remover.' }

        const { error } = await ctx.supabase
            .from('credits')
            .insert({
                tenant_id: ctx.tenantId,
                client_id: customerId,
                quantity: delta
            })

        if (error) {
            console.error('Error inserting credits:', error)
            return { error: 'Erro ao inicializar créditos.' }
        }

        await ctx.supabase.from('credit_logs').insert({
            tenant_id: ctx.tenantId,
            client_id: customerId,
            quantity_change: delta,
            type: 'manual_adjustment',
            notes: 'Créditos inicializados via painel'
        })
    }

    revalidatePath(`/dashboard/clientes/${customerId}`)
    revalidatePath('/dashboard/clientes')
    return { success: true }
}

export async function getCustomerCreditLogs(customerId: string) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('credit_logs')
        .select('*')
        .eq('client_id', customerId)
        .eq('tenant_id', ctx.tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching credit logs:', error)
        return []
    }

    return data
}

export async function getTenantInviteCode() {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { data: tenant } = await ctx.supabase
        .from('tenants')
        .select('invite_code')
        .eq('id', ctx.tenantId)
        .single()

    return tenant?.invite_code || null
}

export async function getCustomerAppointments(customerId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { data, error } = await ctx.supabase
        .from('appointments')
        .select('*, service:service_id(name), professional:professional_id(name)')
        .eq('client_id', customerId)
        .eq('tenant_id', ctx.tenantId)
        .order('start_time', { ascending: false })

    if (error) {
        console.error('Error fetching customer appointments:', error)
        return []
    }

    return data
}
