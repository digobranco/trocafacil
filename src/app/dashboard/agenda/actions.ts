'use server'

import { getAuthContext, AuthContext } from '@/utils/auth-context'
import { revalidatePath } from 'next/cache'

// Re-export getCurrentUser using getAuthContext (backward compatible)
export async function getCurrentUser() {
    const ctx = await getAuthContext()
    return ctx?.profile || null
}

export type CreditBucket = {
    id: string
    quantity: number
    name: string
    service_restrictions: string[] | null
}

export async function getUserCredits() {
    const ctx = await getAuthContext()
    if (!ctx || ctx.role !== 'customer' || !ctx.identityId) return []

    return getCreditsInternal(ctx)
}

async function getCreditsInternal(ctx: AuthContext): Promise<CreditBucket[]> {
    if (ctx.role !== 'customer' || !ctx.identityId) return []

    const { data: credits, error } = await ctx.supabase
        .from('credits')
        .select(`
            id,
            quantity,
            service_restrictions,
            plan:membership_plan_id (name)
        `)
        .eq('client_id', ctx.identityId)
        .eq('tenant_id', ctx.tenantId)
        .gt('quantity', 0)

    if (error) {
        console.error('Error fetching credits:', error)
        return []
    }

    return (credits || []).map(c => ({
        id: c.id,
        quantity: c.quantity,
        name: (c.plan as any)?.name || 'Créditos Avulsos',
        service_restrictions: c.service_restrictions as string[] | null
    }))
}

export type Schedule = {
    id?: string
    professional_id?: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
    max_participants?: number
}

export async function getSchedules(professionalId?: string) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    let query = ctx.supabase
        .from('schedules')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .order('day_of_week')

    if (professionalId) {
        query = query.eq('professional_id', professionalId)
    }

    const { data } = await query
    return data || []
}

export async function saveSchedules(schedules: Schedule[], professionalId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { data: existingSchedules } = await ctx.supabase
        .from('schedules')
        .select('id')
        .eq('professional_id', professionalId)

    const existingIds = existingSchedules?.map(s => s.id) || []
    const incomingIds = schedules.map(s => s.id).filter(Boolean) as string[]
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

    if (idsToDelete.length > 0) {
        await ctx.supabase.from('schedules').delete().in('id', idsToDelete)
    }

    const recordsToInsert = schedules
        .filter(s => !s.id)
        .map(s => ({
            tenant_id: ctx.tenantId,
            professional_id: professionalId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_active: s.is_active,
            max_participants: s.max_participants || 1
        }))

    const recordsToUpdate = schedules
        .filter(s => s.id)
        .map(s => ({
            id: s.id,
            tenant_id: ctx.tenantId,
            professional_id: professionalId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_active: s.is_active,
            max_participants: s.max_participants || 1
        }))

    if (recordsToInsert.length > 0) {
        const { error } = await ctx.supabase.from('schedules').insert(recordsToInsert)
        if (error) {
            console.error('Insert Schedules Error:', error)
            return { error: 'Erro ao criar novos horários.' }
        }
    }

    if (recordsToUpdate.length > 0) {
        const { error } = await ctx.supabase.from('schedules').upsert(recordsToUpdate)
        if (error) {
            console.error('Update Schedules Error:', error)
            return { error: 'Erro ao atualizar horários existentes.' }
        }
    }

    revalidatePath('/dashboard/agenda/disponibilidade')
    return { success: true }
}

export async function getProfessionals() {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data } = await ctx.supabase
        .from('professionals')
        .select('id, name')
        .eq('tenant_id', ctx.tenantId)
        .eq('active', true)
        .order('name')

    return data || []
}

export type AgendaSlot = {
    time: string
    status: 'free' | 'busy' | 'partial'
    professionalId?: string
    professionalName?: string
    maxParticipants: number
    currentCount: number
    appointments: any[]
}

// Internal agenda builder (uses existing context)
async function getDailyAgendaInternal(ctx: AuthContext, dateStr: string, professionalId?: string): Promise<AgendaSlot[]> {
    const [year, month, day] = dateStr.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    const dayOfWeek = localDate.getDay()

    // Fetch schedules and appointments in PARALLEL
    let schedulesQuery = ctx.supabase
        .from('schedules')
        .select('*, professional:professional_id(id, name)')
        .eq('tenant_id', ctx.tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

    if (professionalId && professionalId !== 'all' && professionalId !== '') {
        schedulesQuery = schedulesQuery.eq('professional_id', professionalId)
    }

    // Fetch appointments for the entire day in UTC
    // Database stores in UTC, so we need to account for Brazil timezone (UTC-3)
    const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 3, 0, 0))  // 00:00 BRT = 03:00 UTC
    const endOfDayUTC = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59))  // 23:59 BRT = 02:59 UTC next day

    let appointmentsQuery = ctx.supabase
        .from('appointments')
        .select('id, start_time, status, type, client_id, professional_id, service_id, recurring_group_id, client:client_id(full_name), service:service_id(name), professional:professional_id(id, name)')
        .eq('tenant_id', ctx.tenantId)
        .in('status', ['scheduled', 'completed', 'absent'])
        .gte('start_time', startOfDayUTC.toISOString())
        .lte('start_time', endOfDayUTC.toISOString())

    if (professionalId && professionalId !== 'all' && professionalId !== '') {
        appointmentsQuery = appointmentsQuery.eq('professional_id', professionalId)
    }

    // PARALLEL fetch
    const [schedulesRes, appointmentsRes] = await Promise.all([
        schedulesQuery,
        appointmentsQuery
    ])

    const schedules = schedulesRes.data
    const appointments = appointmentsRes.data

    const slots: AgendaSlot[] = []

    if (!schedules || schedules.length === 0) {
        if (appointments && appointments.length > 0) {
            const hourGroups = new Map<string, any[]>()

            for (const app of appointments) {
                // Convert UTC to Brazil time (UTC-3)
                const utcDate = new Date(app.start_time)
                const brDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000)
                const timeString = `${String(brDate.getUTCHours()).padStart(2, '0')}:00`
                if (!hourGroups.has(timeString)) hourGroups.set(timeString, [])
                hourGroups.get(timeString)!.push(app)
            }

            for (const [time, apps] of hourGroups) {
                slots.push({
                    time,
                    status: 'busy',
                    maxParticipants: 1,
                    currentCount: apps.length,
                    appointments: apps
                })
            }
            return slots.sort((a, b) => a.time.localeCompare(b.time))
        }
        return []
    }

    schedules.sort((a, b) => a.start_time.localeCompare(b.start_time))

    for (const schedule of schedules) {
        const [startHour] = schedule.start_time.split(':').map(Number)
        const [endHour] = schedule.end_time.split(':').map(Number)
        const professional = schedule.professional as { id: string; name: string } | null
        const maxParticipants = schedule.max_participants || 1

        let currentHour = startHour
        while (currentHour < endHour) {
            const timeString = `${String(currentHour).padStart(2, '0')}:00`

            const hourAppointments = appointments?.filter(app => {
                // Convert UTC to Brazil time (UTC-3)
                const utcDate = new Date(app.start_time)
                const brDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000)
                const appH = brDate.getUTCHours()
                const appProf = app.professional as any

                return appH === currentHour && appProf?.id === professional?.id
            }) || []

            const currentCount = hourAppointments.length
            let status: 'free' | 'busy' | 'partial' = 'free'

            if (currentCount >= maxParticipants) {
                status = 'busy'
            } else if (currentCount > 0) {
                status = 'partial'
            }

            slots.push({
                time: timeString,
                professionalId: professional?.id,
                professionalName: professional?.name,
                maxParticipants,
                currentCount,
                status,
                appointments: hourAppointments
            })

            currentHour++
        }
    }

    return slots
}

// Public standalone version (backward compatible)
export async function getDailyAgenda(dateStr: string, professionalId?: string): Promise<AgendaSlot[]> {
    const ctx = await getAuthContext()
    if (!ctx) return []
    return getDailyAgendaInternal(ctx, dateStr, professionalId)
}

/**
 * MERGED ACTION: Returns user, credits, professionals AND agenda in a single call.
 * Eliminates 3 separate auth round-trips.
 * 
 * Before: getCurrentUser() + getUserCredits() + getDailyAgenda() = 3 auth calls (9 DB queries for auth)
 * After:  getAgendaPageData() = 1 auth call (3 DB queries for auth)
 */
export async function getAgendaPageData(dateStr: string, professionalId?: string) {
    const ctx = await getAuthContext()
    if (!ctx) return { user: null, credits: [], professionals: [], slots: [], holiday: null }

    // Fetch credits, professionals, agenda slots and holiday ALL IN PARALLEL
    const [credits, professionalsRes, slots, holidayRes] = await Promise.all([
        getCreditsInternal(ctx),
        ctx.supabase
            .from('professionals')
            .select('id, name')
            .eq('tenant_id', ctx.tenantId)
            .eq('active', true)
            .order('name'),
        getDailyAgendaInternal(ctx, dateStr, professionalId),
        ctx.supabase
            .from('holidays')
            .select('name')
            .or(`tenant_id.eq.${ctx.tenantId},is_national.eq.true`)
            .lte('start_date', dateStr)
            .gte('end_date', dateStr)
            .maybeSingle()
    ])

    return {
        user: ctx.profile,
        credits,
        professionals: professionalsRes.data || [],
        slots,
        holiday: holidayRes.data?.name || null
    }
}
