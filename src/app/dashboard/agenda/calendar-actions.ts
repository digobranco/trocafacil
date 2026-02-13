'use server'

import { getAuthContext, AuthContext } from '@/utils/auth-context'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'

export type DaySummary = {
    date: string
    dayOfWeek: number
    appointmentsCount: number
    userAppointmentsCount: number
    availableSlots: number
    hasAvailability: boolean
}

// Shared logic for fetching day summaries over a date range
async function getAgendaSummary(ctx: AuthContext, rangeStart: Date, rangeEnd: Date, professionalId?: string): Promise<DaySummary[]> {
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })

    // Build queries
    let appointmentsQuery = ctx.supabase
        .from('appointments')
        .select('start_time, professional_id, client_id')
        .eq('tenant_id', ctx.tenantId)
        .in('status', ['scheduled', 'completed', 'absent'])
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())

    if (professionalId && professionalId !== 'all' && professionalId !== '') {
        appointmentsQuery = appointmentsQuery.eq('professional_id', professionalId)
    }

    let schedulesQuery = ctx.supabase
        .from('schedules')
        .select('day_of_week, professional_id, max_participants, start_time, end_time')
        .eq('tenant_id', ctx.tenantId)
        .eq('is_active', true)

    if (professionalId && professionalId !== 'all' && professionalId !== '') {
        schedulesQuery = schedulesQuery.eq('professional_id', professionalId)
    }

    // PARALLEL fetch: appointments + schedules at the same time
    const [appointmentsRes, schedulesRes] = await Promise.all([
        appointmentsQuery,
        schedulesQuery
    ])

    const appointments = appointmentsRes.data
    const schedules = schedulesRes.data

    // Calculate daily capacity from schedules
    const dailyCapacity = new Map<number, number>()
    schedules?.forEach(s => {
        const [startH] = s.start_time.split(':').map(Number)
        const [endH] = s.end_time.split(':').map(Number)
        const hours = endH - startH
        const capacity = hours * (s.max_participants || 1)
        dailyCapacity.set(s.day_of_week, (dailyCapacity.get(s.day_of_week) || 0) + capacity)
    })

    const activeDays = new Set(schedules?.map(s => s.day_of_week) || [])

    return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayOfWeek = day.getDay()
        const dayAppointments = appointments?.filter(a => {
            // Convert UTC to Brazil time (UTC-3)
            const utcDate = new Date(a.start_time)
            const brDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000)
            return format(brDate, 'yyyy-MM-dd') === dayStr
        }) || []

        const capacity = dailyCapacity.get(dayOfWeek) || 0
        const dayUserAppointments = dayAppointments.filter(a => {
            if (ctx.role === 'customer') {
                return a.client_id === ctx.identityId
            } else {
                return a.professional_id === ctx.identityId
            }
        })

        return {
            date: dayStr,
            dayOfWeek,
            appointmentsCount: dayAppointments.length,
            userAppointmentsCount: dayUserAppointments.length,
            availableSlots: Math.max(0, capacity - dayAppointments.length),
            hasAvailability: activeDays.has(dayOfWeek)
        }
    })
}

export async function getWeeklyAgenda(dateStr: string, professionalId?: string): Promise<DaySummary[]> {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const date = new Date(dateStr)
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

    return getAgendaSummary(ctx, weekStart, weekEnd, professionalId)
}

export async function getMonthlyAgenda(dateStr: string, professionalId?: string): Promise<DaySummary[]> {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const date = new Date(dateStr)
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)

    return getAgendaSummary(ctx, monthStart, monthEnd, professionalId)
}
