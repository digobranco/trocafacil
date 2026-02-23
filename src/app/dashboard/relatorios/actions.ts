'use server'

import { getAuthContext } from '@/utils/auth-context'

export interface ReportFilters {
    startDate: string
    endDate: string
    professionalId?: string
    status?: string
}

export async function getAppointmentsReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return { data: [], totals: { scheduled: 0, completed: 0, absent: 0, cancelled: 0, total: 0 } }

    const { supabase, tenantId } = ctx

    let query = supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            end_time,
            status,
            type,
            customers ( full_name ),
            professionals ( name ),
            services ( name )
        `)
        .eq('tenant_id', tenantId)
        .gte('start_time', filters.startDate + 'T00:00:00')
        .lte('start_time', filters.endDate + 'T23:59:59')
        .order('start_time')

    if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId)
    }

    if (filters.status) {
        query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching appointments report:', error)
        return { data: [], totals: { scheduled: 0, completed: 0, absent: 0, cancelled: 0, total: 0 } }
    }

    const rows = (data || []).map(a => ({
        id: a.id,
        date: a.start_time,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        type: a.type,
        clientName: (a.customers as any)?.full_name || '-',
        professionalName: (a.professionals as any)?.name || '-',
        serviceName: (a.services as any)?.name || '-',
    }))

    const totals = {
        scheduled: rows.filter(r => r.status === 'scheduled').length,
        completed: rows.filter(r => r.status === 'completed').length,
        absent: rows.filter(r => r.status === 'absent').length,
        cancelled: rows.filter(r => r.status === 'cancelled').length,
        total: rows.length,
    }

    return { data: rows, totals }
}

export async function getFrequencyReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx

    let query = supabase
        .from('appointments')
        .select(`
            id,
            status,
            customers ( id, full_name )
        `)
        .eq('tenant_id', tenantId)
        .gte('start_time', filters.startDate + 'T00:00:00')
        .lte('start_time', filters.endDate + 'T23:59:59')
        .in('status', ['completed', 'absent'])

    if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching frequency report:', error)
        return []
    }

    // Aggregate by client
    const clientMap: Record<string, { name: string; completed: number; absent: number; total: number }> = {}

    for (const apt of data || []) {
        const customer = apt.customers as any
        if (!customer?.id) continue

        if (!clientMap[customer.id]) {
            clientMap[customer.id] = { name: customer.full_name, completed: 0, absent: 0, total: 0 }
        }

        clientMap[customer.id].total++
        if (apt.status === 'completed') clientMap[customer.id].completed++
        if (apt.status === 'absent') clientMap[customer.id].absent++
    }

    return Object.entries(clientMap)
        .map(([id, c]) => ({
            clientId: id,
            clientName: c.name,
            completed: c.completed,
            absent: c.absent,
            total: c.total,
            attendanceRate: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
}

export async function getOccupancyReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx

    const { data: professionals } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name')

    if (!professionals || professionals.length === 0) return []

    const results = []

    for (const prof of professionals) {
        if (filters.professionalId && filters.professionalId !== prof.id) continue

        const { count } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', prof.id)
            .in('status', ['scheduled', 'completed'])
            .gte('start_time', filters.startDate + 'T00:00:00')
            .lte('start_time', filters.endDate + 'T23:59:59')

        // Calculate total capacity in the period
        const { data: schedules } = await supabase
            .from('schedules')
            .select('max_participants, start_time, end_time, day_of_week')
            .eq('professional_id', prof.id)
            .eq('is_active', true)

        let totalCapacity = 0
        if (schedules) {
            // Count how many weeks the period spans
            const start = new Date(filters.startDate)
            const end = new Date(filters.endDate)
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

            // For each day in the period, check if there's a schedule
            for (let i = 0; i < days; i++) {
                const d = new Date(start)
                d.setDate(d.getDate() + i)
                const dow = d.getDay()

                for (const s of schedules) {
                    if (s.day_of_week === dow) {
                        const [startH] = s.start_time.split(':').map(Number)
                        const [endH] = s.end_time.split(':').map(Number)
                        totalCapacity += (endH - startH) * (s.max_participants || 1)
                    }
                }
            }
        }

        const booked = count || 0

        results.push({
            id: prof.id,
            name: prof.name,
            booked,
            capacity: totalCapacity,
            percentage: totalCapacity > 0 ? Math.round((booked / totalCapacity) * 100) : 0,
        })
    }

    return results
}

export async function getProfessionalsForFilter() {
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

export async function getRevenueReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return { plans: [], totalMonthly: 0 }

    const { supabase, tenantId } = ctx

    const { data, error } = await supabase
        .from('client_memberships')
        .select(`
            id,
            status,
            start_date,
            membership_plans ( name, plan_type, monthly_price, package_price ),
            customers:client_id ( full_name )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .lte('start_date', filters.endDate)
        .or(`end_date.is.null,end_date.gte.${filters.startDate}`)

    if (error) {
        console.error('Error fetching revenue report:', error)
        return { plans: [], totalMonthly: 0 }
    }

    if (!data) return { plans: [], totalMonthly: 0 }

    let totalMonthly = 0
    const plans = data.map(m => {
        const plan = m.membership_plans as any
        const price = plan?.monthly_price || plan?.package_price || 0
        if (plan?.monthly_price) totalMonthly += plan.monthly_price
        return {
            id: m.id,
            clientName: (m.customers as any)?.full_name || '-',
            planName: plan?.name || '-',
            planType: plan?.plan_type === 'package' ? 'Pacote' : 'Mensal',
            price,
        }
    })

    return { plans, totalMonthly }
}

export async function getAbsenceReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx

    let query = supabase
        .from('appointments')
        .select(`
            id,
            status,
            start_time,
            customers ( id, full_name, phone )
        `)
        .eq('tenant_id', tenantId)
        .gte('start_time', filters.startDate + 'T00:00:00')
        .lte('start_time', filters.endDate + 'T23:59:59')
        .in('status', ['completed', 'absent'])

    if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId)
    }

    const { data, error } = await query

    if (error) return []

    const clientMap: Record<string, {
        name: string
        phone: string
        completed: number
        absent: number
        total: number
        lastAbsence: string | null
    }> = {}

    for (const apt of data || []) {
        const customer = apt.customers as any
        if (!customer?.id) continue

        if (!clientMap[customer.id]) {
            clientMap[customer.id] = {
                name: customer.full_name,
                phone: customer.phone || '-',
                completed: 0,
                absent: 0,
                total: 0,
                lastAbsence: null,
            }
        }

        clientMap[customer.id].total++
        if (apt.status === 'completed') clientMap[customer.id].completed++
        if (apt.status === 'absent') {
            clientMap[customer.id].absent++
            if (!clientMap[customer.id].lastAbsence || apt.start_time > clientMap[customer.id].lastAbsence!) {
                clientMap[customer.id].lastAbsence = apt.start_time
            }
        }
    }

    return Object.entries(clientMap)
        .filter(([, c]) => c.absent > 0)
        .map(([id, c]) => ({
            clientId: id,
            clientName: c.name,
            phone: c.phone,
            completed: c.completed,
            absent: c.absent,
            total: c.total,
            absenceRate: c.total > 0 ? Math.round((c.absent / c.total) * 100) : 0,
            lastAbsence: c.lastAbsence,
        }))
        .sort((a, b) => b.absenceRate - a.absenceRate)
}

export async function getCreditsReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx

    const { data, error } = await supabase
        .from('credit_logs')
        .select(`
            id,
            quantity_change,
            type,
            notes,
            created_at,
            customers:client_id ( id, full_name )
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', filters.startDate + 'T00:00:00')
        .lte('created_at', filters.endDate + 'T23:59:59')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching credits report:', error)
        return []
    }

    return (data || []).map(log => ({
        id: log.id,
        clientName: (log.customers as any)?.full_name || '-',
        clientId: (log.customers as any)?.id || '-',
        quantityChange: log.quantity_change,
        type: log.type,
        notes: log.notes,
        createdAt: log.created_at,
    }))
}

export async function getActivePlansReport(filters: ReportFilters) {
    const ctx = await getAuthContext()
    if (!ctx) return { distribution: [], details: [] }

    const { supabase, tenantId } = ctx

    const { data, error } = await supabase
        .from('client_memberships')
        .select(`
            id,
            status,
            start_date,
            membership_plans ( id, name, plan_type ),
            customers:client_id ( full_name )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .lte('start_date', filters.endDate)
        .or(`end_date.is.null,end_date.gte.${filters.startDate}`)
        .order('start_date', { ascending: false })

    if (error) {
        console.error('Error fetching active plans report:', error)
        return { distribution: [], details: [] }
    }

    if (!data) return { distribution: [], details: [] }

    // Distribution by plan
    const planMap: Record<string, { name: string; planType: string; count: number }> = {}
    const details = data.map(m => {
        const plan = m.membership_plans as any
        const planId = plan?.id || 'unknown'
        if (!planMap[planId]) {
            planMap[planId] = { name: plan?.name || '-', planType: plan?.plan_type || '-', count: 0 }
        }
        planMap[planId].count++

        return {
            id: m.id,
            clientName: (m.customers as any)?.full_name || '-',
            planName: plan?.name || '-',
            planType: plan?.plan_type === 'package' ? 'Pacote' : 'Mensal',
            startDate: m.start_date,
        }
    })

    const distribution = Object.entries(planMap)
        .map(([id, p]) => ({
            planId: id,
            planName: p.name,
            planType: p.planType === 'package' ? 'Pacote' : 'Mensal',
            count: p.count,
            percentage: data.length > 0 ? Math.round((p.count / data.length) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)

    return { distribution, details }
}
