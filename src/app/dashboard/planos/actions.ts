'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'

// ==========================================
// Types
// ==========================================

export type PlanType = 'weekly_frequency' | 'monthly_credits' | 'package' | 'unlimited'

export type MembershipPlan = {
    id: string
    name: string
    description: string | null
    plan_type: PlanType
    monthly_price: number | null
    package_price: number | null
    weekly_frequency: number | null
    credits_per_month: number | null
    total_credits: number | null
    credit_validity_days: number
    service_restrictions: string[] | null
    is_active: boolean
    created_at: string
}

export type ClientMembership = {
    id: string
    client_id: string
    membership_plan_id: string
    start_date: string
    end_date: string | null
    status: 'active' | 'paused' | 'cancelled'
    weekly_limit: number | null
    created_at: string
    membership_plans?: MembershipPlan
    customers?: { id: string; full_name: string }
}

export type CreatePlanData = {
    name: string
    description?: string
    plan_type: PlanType
    monthly_price?: number | null
    package_price?: number | null
    weekly_frequency?: number | null
    credits_per_month?: number | null
    total_credits?: number | null
    credit_validity_days?: number
    service_restrictions?: string[] | null
}

// ==========================================
// Plans CRUD
// ==========================================

export async function getPlans() {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('membership_plans')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .order('name')

    if (error) {
        console.error('Error fetching plans:', error)
        return []
    }

    return data as MembershipPlan[]
}

export async function getActivePlans() {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('membership_plans')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching active plans:', error)
        return []
    }

    return data as MembershipPlan[]
}

export async function createPlan(planData: CreatePlanData) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can create plans')

    const { error } = await ctx.supabase
        .from('membership_plans')
        .insert({
            tenant_id: ctx.tenantId,
            name: planData.name,
            description: planData.description || null,
            plan_type: planData.plan_type,
            monthly_price: planData.monthly_price || null,
            package_price: planData.package_price || null,
            weekly_frequency: planData.weekly_frequency || null,
            credits_per_month: planData.credits_per_month || null,
            total_credits: planData.total_credits || null,
            credit_validity_days: planData.credit_validity_days || 30,
            service_restrictions: planData.service_restrictions || null,
            is_active: true,
        })

    if (error) {
        console.error('Error creating plan:', error)
        return { error: 'Falha ao criar plano.' }
    }

    revalidatePath('/dashboard/planos')
    return { success: true }
}

export async function updatePlan(id: string, planData: Partial<CreatePlanData>) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can update plans')

    const { error } = await ctx.supabase
        .from('membership_plans')
        .update({
            name: planData.name,
            description: planData.description || null,
            plan_type: planData.plan_type,
            monthly_price: planData.monthly_price || null,
            package_price: planData.package_price || null,
            weekly_frequency: planData.weekly_frequency || null,
            credits_per_month: planData.credits_per_month || null,
            total_credits: planData.total_credits || null,
            credit_validity_days: planData.credit_validity_days || 30,
            service_restrictions: planData.service_restrictions || null,
        })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error updating plan:', error)
        return { error: 'Falha ao atualizar plano.' }
    }

    revalidatePath('/dashboard/planos')
    return { success: true }
}

export async function togglePlan(id: string, isActive: boolean) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can manage plans')

    const { error } = await ctx.supabase
        .from('membership_plans')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error toggling plan:', error)
        return { error: 'Falha ao alterar status do plano.' }
    }

    revalidatePath('/dashboard/planos')
    return { success: true }
}

// ==========================================
// Client Memberships
// ==========================================

export async function getClientMemberships(clientId?: string) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    let query = ctx.supabase
        .from('client_memberships')
        .select(`
            *,
            membership_plans (*),
            customers:client_id (id, full_name)
        `)
        .eq('tenant_id', ctx.tenantId)
        .order('created_at', { ascending: false })

    if (clientId) {
        query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching memberships:', error)
        return []
    }

    return data as ClientMembership[]
}

export async function getActiveClientMembership(clientId: string) {
    const ctx = await getAuthContext()
    if (!ctx) return null

    const { data, error } = await ctx.supabase
        .from('client_memberships')
        .select(`
            *,
            membership_plans (*)
        `)
        .eq('tenant_id', ctx.tenantId)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle()

    if (error) {
        console.error('Error fetching active membership:', error)
        return null
    }

    return data as ClientMembership | null
}

export async function createClientMembership(data: {
    clientId: string
    planId: string
    startDate: string
}) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can assign plans')

    // Get the plan details
    const { data: plan, error: planError } = await ctx.supabase
        .from('membership_plans')
        .select('*')
        .eq('id', data.planId)
        .eq('tenant_id', ctx.tenantId)
        .single()

    if (planError || !plan) {
        return { error: 'Plano não encontrado.' }
    }

    // Cancel any existing active membership for this client
    await ctx.supabase
        .from('client_memberships')
        .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
        .eq('client_id', data.clientId)
        .eq('tenant_id', ctx.tenantId)
        .eq('status', 'active')

    // Create the membership
    const { error: membershipError } = await ctx.supabase
        .from('client_memberships')
        .insert({
            tenant_id: ctx.tenantId,
            client_id: data.clientId,
            membership_plan_id: data.planId,
            start_date: data.startDate,
            status: 'active',
            weekly_limit: plan.weekly_frequency || null,
        })

    if (membershipError) {
        console.error('Error creating membership:', membershipError)
        return { error: 'Falha ao atribuir plano.' }
    }

    // Calculate and create initial credits
    const credits = calculateCreditsForMonth(plan, new Date(data.startDate))

    if (credits > 0) {
        // Check if client already has credits
        const { data: existingCredit } = await ctx.supabase
            .from('credits')
            .select('id, quantity')
            .eq('client_id', data.clientId)
            .eq('tenant_id', ctx.tenantId)
            .maybeSingle()

        const validUntil = new Date(data.startDate)
        validUntil.setDate(validUntil.getDate() + (plan.credit_validity_days || 30))

        if (existingCredit) {
            await ctx.supabase
                .from('credits')
                .update({
                    quantity: credits,
                    valid_until: validUntil.toISOString(),
                    membership_plan_id: plan.id,
                    service_restrictions: plan.service_restrictions,
                    origin_type: plan.plan_type === 'package' ? 'package' : 'plan',
                })
                .eq('id', existingCredit.id)
        } else {
            await ctx.supabase
                .from('credits')
                .insert({
                    tenant_id: ctx.tenantId,
                    client_id: data.clientId,
                    quantity: credits,
                    valid_until: validUntil.toISOString(),
                    membership_plan_id: plan.id,
                    service_restrictions: plan.service_restrictions,
                    origin_type: plan.plan_type === 'package' ? 'package' : 'plan',
                })
        }

        // Log
        await ctx.supabase.from('credit_logs').insert({
            tenant_id: ctx.tenantId,
            client_id: data.clientId,
            quantity_change: credits,
            type: 'addition',
            notes: `Créditos do plano "${plan.name}" - ${credits} aula(s)`,
        })
    }

    revalidatePath(`/dashboard/clientes/${data.clientId}`)
    revalidatePath('/dashboard/planos')
    return { success: true }
}

export async function cancelClientMembership(membershipId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can cancel memberships')

    const { error } = await ctx.supabase
        .from('client_memberships')
        .update({
            status: 'cancelled',
            end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', membershipId)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error cancelling membership:', error)
        return { error: 'Falha ao cancelar assinatura.' }
    }

    revalidatePath('/dashboard/planos')
    return { success: true }
}

// ==========================================
// Credit Calculation
// ==========================================

function countWeeksInMonth(date: Date): number {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()

    // Count full weeks (7-day spans)
    return Math.ceil(totalDays / 7)
}

function calculateCreditsForMonth(plan: any, date: Date): number {
    switch (plan.plan_type) {
        case 'weekly_frequency':
            return countWeeksInMonth(date) * (plan.weekly_frequency || 1)
        case 'monthly_credits':
            return plan.credits_per_month || 0
        case 'package':
            return plan.total_credits || 0
        case 'unlimited':
            // For unlimited, set a high number (days in month)
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            return lastDay.getDate()
        default:
            return 0
    }
}

export async function renewMonthlyCredits() {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can renew credits')

    // Get all active memberships for this tenant
    const { data: memberships, error: membershipError } = await ctx.supabase
        .from('client_memberships')
        .select(`
            *,
            membership_plans (*)
        `)
        .eq('tenant_id', ctx.tenantId)
        .eq('status', 'active')

    if (membershipError) {
        console.error('Error fetching memberships:', membershipError)
        return { error: 'Falha ao buscar assinaturas.' }
    }

    if (!memberships || memberships.length === 0) {
        return { error: 'Nenhuma assinatura ativa encontrada.' }
    }

    const now = new Date()
    let renewedCount = 0

    for (const membership of memberships) {
        const plan = membership.membership_plans as any
        if (!plan) continue

        // Skip packages — they only get credits once
        if (plan.plan_type === 'package') continue

        const credits = calculateCreditsForMonth(plan, now)
        if (credits <= 0) continue

        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + (plan.credit_validity_days || 30))

        // Update or create credits
        const { data: existingCredit } = await ctx.supabase
            .from('credits')
            .select('id')
            .eq('client_id', membership.client_id)
            .eq('tenant_id', ctx.tenantId)
            .maybeSingle()

        if (existingCredit) {
            await ctx.supabase
                .from('credits')
                .update({
                    quantity: credits,
                    valid_until: validUntil.toISOString(),
                    membership_plan_id: plan.id,
                    service_restrictions: plan.service_restrictions,
                    origin_type: 'plan',
                })
                .eq('id', existingCredit.id)
        } else {
            await ctx.supabase
                .from('credits')
                .insert({
                    tenant_id: ctx.tenantId,
                    client_id: membership.client_id,
                    quantity: credits,
                    valid_until: validUntil.toISOString(),
                    membership_plan_id: plan.id,
                    service_restrictions: plan.service_restrictions,
                    origin_type: 'plan',
                })
        }

        // Log
        await ctx.supabase.from('credit_logs').insert({
            tenant_id: ctx.tenantId,
            client_id: membership.client_id,
            quantity_change: credits,
            type: 'addition',
            notes: `Renovação mensal - plano "${plan.name}" - ${credits} aula(s)`,
        })

        renewedCount++
    }

    revalidatePath('/dashboard/planos')
    return { success: true, count: renewedCount }
}

// ==========================================
// Plan Labels (UI helpers)
// ==========================================

export function getPlanTypeLabel(type: PlanType): string {
    switch (type) {
        case 'weekly_frequency': return 'Frequência Semanal'
        case 'monthly_credits': return 'Créditos Mensais'
        case 'package': return 'Pacote Avulso'
        case 'unlimited': return 'Ilimitado'
        default: return type
    }
}
