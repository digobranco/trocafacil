'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'
import { addWeeks } from 'date-fns'
import { randomUUID } from 'crypto'

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
    professional_id: string | null
    service_id: string | null
    schedule_days: number[] | null
    schedule_time: string | null
    created_at: string
    membership_plans?: MembershipPlan
    customers?: { id: string; full_name: string }
    professionals?: { id: string; name: string }
    services?: { id: string; name: string }
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
            membership_plans (*),
            professionals:professional_id (id, name),
            services:service_id (id, name)
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
    professionalId: string
    serviceId: string
    scheduleDays: number[]
    scheduleTime: string
    weeks?: number
}) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can assign plans')

    const { supabase, tenantId } = ctx

    // Get the plan details
    const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', data.planId)
        .eq('tenant_id', tenantId)
        .single()

    if (planError || !plan) {
        return { error: 'Plano não encontrado.' }
    }

    // Get service duration
    const { data: serviceData } = await supabase
        .from('professional_services')
        .select(`
            custom_duration_minutes,
            services (
                duration_minutes
            )
        `)
        .eq('professional_id', data.professionalId)
        .eq('service_id', data.serviceId)
        .single()

    if (!serviceData) {
        return { error: 'Serviço não encontrado para este profissional.' }
    }

    const service = serviceData.services as unknown as { duration_minutes: number }
    const durationMinutes = serviceData.custom_duration_minutes ?? service.duration_minutes

    // ==========================================
    // 1. Build appointment slots FIRST (before any DB writes)
    // ==========================================
    const weeksToGenerate = data.weeks || 4
    const [hour, minute] = data.scheduleTime.split(':').map(Number)
    const [year, month, day] = data.startDate.split('-').map(Number)
    const baseDate = new Date(year, month - 1, day)
    const baseDayOfWeek = baseDate.getDay()
    const groupId = randomUUID()

    const appointments = []
    const now = new Date()
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    for (let week = 0; week < weeksToGenerate; week++) {
        const weekBaseDate = addWeeks(baseDate, week)

        for (const targetDay of data.scheduleDays) {
            const dayDiff = targetDay - baseDayOfWeek
            const startTime = new Date(weekBaseDate)
            startTime.setDate(startTime.getDate() + dayDiff)
            startTime.setHours(hour, minute, 0, 0)

            // Skip past dates
            if (startTime < now) continue

            const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

            appointments.push({
                tenant_id: tenantId,
                client_id: data.clientId,
                professional_id: data.professionalId,
                service_id: data.serviceId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'scheduled',
                type: 'recurring',
                recurring_group_id: groupId,
            })
        }
    }

    if (appointments.length === 0) {
        return { error: 'Nenhum agendamento futuro pode ser gerado com os parâmetros informados.' }
    }

    // ==========================================
    // 2. Validate ALL slots BEFORE creating anything
    // ==========================================

    // 2a. Check professional schedule availability for selected days
    const { data: schedules } = await supabase
        .from('schedules')
        .select('max_participants, start_time, end_time, day_of_week')
        .eq('professional_id', data.professionalId)
        .eq('is_active', true)
        .in('day_of_week', data.scheduleDays)

    if (!schedules || schedules.length === 0) {
        return { error: 'O profissional não tem disponibilidade configurada para os dias selecionados.' }
    }

    // Map schedules by day_of_week (only matching the selected time)
    const scheduleByDay: Record<number, { max_participants: number }> = {}
    for (const s of schedules) {
        const [schedStart] = s.start_time.split(':').map(Number)
        const [schedEnd] = s.end_time.split(':').map(Number)
        if (hour >= schedStart && hour < schedEnd) {
            scheduleByDay[s.day_of_week] = s
        }
    }

    // Validate that all selected days have a matching schedule at the chosen time
    for (const d of data.scheduleDays) {
        if (!scheduleByDay[d]) {
            return { error: `O profissional não tem disponibilidade para ${dayNames[d]} às ${data.scheduleTime}.` }
        }
    }

    // 2b. Check capacity and client conflicts for each appointment
    for (const apt of appointments) {
        const aptDate = new Date(apt.start_time)
        const aptDayOfWeek = aptDate.getDay()
        const formattedDate = aptDate.toLocaleDateString('pt-BR')

        // Capacity check
        const startOfHour = new Date(aptDate)
        startOfHour.setMinutes(0, 0, 0)
        const endOfHour = new Date(aptDate)
        endOfHour.setMinutes(59, 59, 999)

        const { count } = await supabase
            .from('appointments')
            .select('id', { count: 'exact' })
            .eq('professional_id', data.professionalId)
            .eq('status', 'scheduled')
            .gte('start_time', startOfHour.toISOString())
            .lte('start_time', endOfHour.toISOString())

        const currentCount = count || 0
        const maxParticipants = scheduleByDay[aptDayOfWeek]?.max_participants || 1

        if (currentCount >= maxParticipants) {
            return {
                error: `Horário lotado em ${formattedDate} (${dayNames[aptDayOfWeek]}) às ${data.scheduleTime}. Capacidade: ${currentCount}/${maxParticipants}.`
            }
        }

        // Client conflict check
        const { data: clientConflict } = await supabase
            .from('appointments')
            .select('id')
            .eq('client_id', data.clientId)
            .eq('start_time', apt.start_time)
            .eq('status', 'scheduled')
            .maybeSingle()

        if (clientConflict) {
            return {
                error: `O cliente já possui um agendamento em ${formattedDate} (${dayNames[aptDayOfWeek]}) às ${data.scheduleTime}.`
            }
        }
    }

    // ==========================================
    // 3. All validations passed — now create membership + appointments
    // ==========================================

    // Cancel any existing active membership for this client
    await supabase
        .from('client_memberships')
        .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
        .eq('client_id', data.clientId)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')

    // Create the membership with schedule config
    const { error: membershipError } = await supabase
        .from('client_memberships')
        .insert({
            tenant_id: tenantId,
            client_id: data.clientId,
            membership_plan_id: data.planId,
            start_date: data.startDate,
            status: 'active',
            weekly_limit: plan.weekly_frequency || null,
            professional_id: data.professionalId,
            service_id: data.serviceId,
            schedule_days: data.scheduleDays,
            schedule_time: data.scheduleTime,
        })

    if (membershipError) {
        console.error('Error creating membership:', membershipError)
        return { error: 'Falha ao atribuir plano.' }
    }

    // Insert all validated appointments
    const { error: insertError } = await supabase
        .from('appointments')
        .insert(appointments)

    if (insertError) {
        console.error('Error creating recurring appointments:', insertError)
        return { error: 'Plano atribuído mas houve erro ao gerar agendamentos.' }
    }

    revalidatePath(`/dashboard/clientes/${data.clientId}`)
    revalidatePath('/dashboard/planos')
    revalidatePath('/dashboard/agenda')
    return { success: true, count: appointments.length }
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
// Generate Appointments for Active Memberships
// ==========================================

export async function generateMonthlyAppointments() {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can generate appointments')

    const { supabase, tenantId } = ctx

    // Get all active memberships with schedule config
    const { data: memberships, error: membershipError } = await supabase
        .from('client_memberships')
        .select(`
            *,
            membership_plans (*)
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .not('schedule_days', 'is', null)

    if (membershipError) {
        console.error('Error fetching memberships:', membershipError)
        return { error: 'Falha ao buscar assinaturas.' }
    }

    if (!memberships || memberships.length === 0) {
        return { error: 'Nenhuma assinatura ativa com agendamento configurado.' }
    }

    const now = new Date()
    let totalGenerated = 0

    for (const membership of memberships) {
        if (!membership.schedule_days || !membership.schedule_time || !membership.professional_id || !membership.service_id) continue

        // Get service duration
        const { data: serviceData } = await supabase
            .from('professional_services')
            .select(`
                custom_duration_minutes,
                services (
                    duration_minutes
                )
            `)
            .eq('professional_id', membership.professional_id)
            .eq('service_id', membership.service_id)
            .single()

        if (!serviceData) continue

        const service = serviceData.services as unknown as { duration_minutes: number }
        const durationMinutes = serviceData.custom_duration_minutes ?? service.duration_minutes

        const [hour, minute] = membership.schedule_time.split(':').map(Number)
        const baseDate = new Date(now)
        baseDate.setHours(0, 0, 0, 0)
        const baseDayOfWeek = baseDate.getDay()
        const groupId = randomUUID()

        const appointments = []

        for (let week = 0; week < 4; week++) {
            const weekBaseDate = addWeeks(baseDate, week)

            for (const targetDay of membership.schedule_days) {
                const dayDiff = targetDay - baseDayOfWeek
                const startTime = new Date(weekBaseDate)
                startTime.setDate(startTime.getDate() + dayDiff)
                startTime.setHours(hour, minute, 0, 0)

                // Skip past dates
                if (startTime < now) continue

                const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

                // Check if appointment already exists at this time for this client
                const { data: existing } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('client_id', membership.client_id)
                    .eq('start_time', startTime.toISOString())
                    .eq('status', 'scheduled')
                    .maybeSingle()

                if (existing) continue // Skip — already has appointment

                appointments.push({
                    tenant_id: tenantId,
                    client_id: membership.client_id,
                    professional_id: membership.professional_id,
                    service_id: membership.service_id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'scheduled',
                    type: 'recurring',
                    recurring_group_id: groupId,
                })
            }
        }

        if (appointments.length > 0) {
            const { error: insertError } = await supabase
                .from('appointments')
                .insert(appointments)

            if (!insertError) {
                totalGenerated += appointments.length
            } else {
                console.error(`Error generating appointments for membership ${membership.id}:`, insertError)
            }
        }
    }

    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard/planos')
    return { success: true, count: totalGenerated }
}

// ==========================================
// Membership Form Data
// ==========================================

export async function getMembershipFormData() {
    const ctx = await getAuthContext()
    if (!ctx) return { professionals: [], plans: [] }

    const [professionalsRes, plansRes] = await Promise.all([
        ctx.supabase
            .from('professionals')
            .select('id, name')
            .eq('tenant_id', ctx.tenantId)
            .eq('active', true)
            .order('name'),
        ctx.supabase
            .from('membership_plans')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .eq('is_active', true)
            .order('name'),
    ])

    return {
        professionals: professionalsRes.data || [],
        plans: (plansRes.data || []) as MembershipPlan[],
    }
}

export async function getProfessionalServicesForMembership(professionalId: string) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('professional_services')
        .select(`
            service_id,
            services (
                id,
                name
            )
        `)
        .eq('professional_id', professionalId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching professional services:', error)
        return []
    }

    return (data || []).map(ps => {
        const service = ps.services as unknown as { id: string; name: string }
        return { id: service.id, name: service.name }
    })
}

