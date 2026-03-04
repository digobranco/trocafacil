'use server'

import { getAuthContext } from '@/utils/auth-context'

export async function getDashboardStats() {
    const ctx = await getAuthContext()
    if (!ctx) return null

    const { supabase, tenantId } = ctx

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Week boundaries (Monday to Sunday)
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59)

    const [
        todayApptsRes,
        completedRes,
        absentRes,
        activePlansRes,
        totalClientsRes,
        newClientsRes,
        creditsRes,
        weekApptsRes,
    ] = await Promise.all([
        supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'scheduled')
            .gte('start_time', todayStart)
            .lte('start_time', todayEnd),
        supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'completed')
            .gte('start_time', thirtyDaysAgo),
        supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'absent')
            .gte('start_time', thirtyDaysAgo),
        supabase
            .from('client_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'active'),
        supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId),
        // New clients this month
        supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', monthStart),
        // Total credits
        supabase
            .from('credits')
            .select('quantity')
            .eq('tenant_id', tenantId),
        // Week appointments with start_time for daily breakdown
        supabase
            .from('appointments')
            .select('start_time')
            .eq('tenant_id', tenantId)
            .eq('status', 'scheduled')
            .gte('start_time', weekStart.toISOString())
            .lte('start_time', weekEnd.toISOString()),
    ])

    const completed = completedRes.count || 0
    const absent = absentRes.count || 0
    const total = completed + absent
    const attendanceRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Sum credits
    let totalCredits = 0
    if (creditsRes.data) {
        for (const c of creditsRes.data) {
            totalCredits += c.quantity || 0
        }
    }

    // Weekly chart data (Mon-Sun)
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    const weeklyChart = dayLabels.map((label, i) => {
        const dayDate = new Date(weekStart)
        dayDate.setDate(dayDate.getDate() + i)
        const dayStr = dayDate.toISOString().split('T')[0]
        const count = (weekApptsRes.data || []).filter(a =>
            a.start_time.startsWith(dayStr)
        ).length
        return { label, count }
    })
    const weekTotal = weeklyChart.reduce((s, d) => s + d.count, 0)

    return {
        todayAppointments: todayApptsRes.count || 0,
        attendanceRate,
        activePlans: activePlansRes.count || 0,
        totalClients: totalClientsRes.count || 0,
        newClientsMonth: newClientsRes.count || 0,
        totalCredits,
        weekTotal,
        weeklyChart,
    }
}

export async function getNextAppointment(customerId: string) {
    const ctx = await getAuthContext()
    if (!ctx) return null

    const { data, error } = await ctx.supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            professionals ( name ),
            services ( name )
        `)
        .eq('client_id', customerId)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (error || !data) return null

    return {
        id: data.id,
        startTime: data.start_time,
        professionalName: (data.professionals as any)?.name,
        serviceName: (data.services as any)?.name,
    }
}

export async function getFilteredAppointments(filter: 'today' | 'tomorrow' | 'week') {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx
    const now = new Date()

    let rangeStart: Date
    let rangeEnd: Date

    if (filter === 'today') {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (filter === 'tomorrow') {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        rangeStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
        rangeEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
    } else {
        // next 7 days
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        rangeEnd = new Date(now)
        rangeEnd.setDate(rangeEnd.getDate() + 6)
        rangeEnd.setHours(23, 59, 59)
    }

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            end_time,
            status,
            customers ( full_name ),
            professionals ( name ),
            services ( name )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'scheduled')
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time')
        .limit(20)

    if (error) {
        console.error('Error fetching filtered appointments:', error)
        return []
    }

    return (data || []).map(a => ({
        id: a.id,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        clientName: (a.customers as any)?.full_name || 'Cliente',
        professionalName: (a.professionals as any)?.name || 'Profissional',
        serviceName: (a.services as any)?.name || 'Serviço',
    }))
}

export async function getFilteredOccupancy(filter: 'today' | 'tomorrow' | 'week') {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx
    const now = new Date()

    let rangeStart: Date
    let rangeEnd: Date
    let daysToCheck: Date[] = []

    if (filter === 'today') {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        daysToCheck = [rangeStart]
    } else if (filter === 'tomorrow') {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        rangeStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
        rangeEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
        daysToCheck = [rangeStart]
    } else {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        rangeEnd = new Date(now)
        rangeEnd.setDate(rangeEnd.getDate() + 6)
        rangeEnd.setHours(23, 59, 59)
        for (let i = 0; i < 7; i++) {
            const d = new Date(rangeStart)
            d.setDate(d.getDate() + i)
            daysToCheck.push(d)
        }
    }

    const { data: professionals } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name')

    if (!professionals || professionals.length === 0) return []

    const results = []

    for (const prof of professionals) {
        const { count } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', prof.id)
            .eq('status', 'scheduled')
            .gte('start_time', rangeStart.toISOString())
            .lte('start_time', rangeEnd.toISOString())

        const { data: schedules } = await supabase
            .from('schedules')
            .select('max_participants, start_time, end_time, day_of_week')
            .eq('professional_id', prof.id)
            .eq('is_active', true)

        let totalCapacity = 0
        if (schedules) {
            for (const day of daysToCheck) {
                const dow = day.getDay()
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

export async function getAvailableSlots() {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { supabase, tenantId } = ctx
    const now = new Date()

    // Check today and tomorrow
    const daysToCheck = [
        new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    ]

    const { data: professionals } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('active', true)

    if (!professionals) return []

    const slots: { professionalName: string; date: string; time: string; available: number }[] = []

    for (const prof of professionals) {
        const { data: schedules } = await supabase
            .from('schedules')
            .select('start_time, end_time, max_participants, day_of_week')
            .eq('professional_id', prof.id)
            .eq('is_active', true)

        if (!schedules) continue

        for (const day of daysToCheck) {
            const dow = day.getDay()
            const daySchedules = schedules.filter(s => s.day_of_week === dow)

            for (const sched of daySchedules) {
                const [startH] = sched.start_time.split(':').map(Number)
                const [endH] = sched.end_time.split(':').map(Number)

                for (let h = startH; h < endH; h++) {
                    const slotStart = new Date(day)
                    slotStart.setHours(h, 0, 0, 0)

                    // Skip past slots
                    if (slotStart < now) continue

                    const slotEnd = new Date(slotStart)
                    slotEnd.setHours(h, 59, 59, 999)

                    const { count } = await supabase
                        .from('appointments')
                        .select('id', { count: 'exact', head: true })
                        .eq('professional_id', prof.id)
                        .eq('status', 'scheduled')
                        .gte('start_time', slotStart.toISOString())
                        .lte('start_time', slotEnd.toISOString())

                    const booked = count || 0
                    const max = sched.max_participants || 1
                    const available = max - booked

                    if (available > 0) {
                        slots.push({
                            professionalName: prof.name,
                            date: day.toISOString().split('T')[0],
                            time: `${String(h).padStart(2, '0')}:00`,
                            available,
                        })
                    }
                }
            }
        }
    }

    // Sort and limit
    return slots
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 8)
}

export async function getOnboardingProgress() {
    const ctx = await getAuthContext()
    if (!ctx) return null

    const { supabase, tenantId } = ctx

    const [
        tenantRes,
        servicesRes,
        professionalsRes,
        linksRes,
        schedulesRes,
        plansRes,
        customersRes,
    ] = await Promise.all([
        supabase.from('tenants').select('logo_url, name, slug').eq('id', tenantId).single(),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
        supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
        supabase.from('professional_services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('membership_plans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])

    const steps = [
        {
            id: 'identity',
            title: '(1) Identidade Visual',
            description: 'Nome, logo e URL da sua empresa',
            isCompleted: !!tenantRes.data?.logo_url,
            href: '/dashboard/configuracoes'
        },
        {
            id: 'services',
            title: '(2) Serviços',
            description: 'Cadastre o que você oferece (ex: Pilates)',
            isCompleted: (servicesRes.count || 0) > 0,
            href: '/dashboard/servicos'
        },
        {
            id: 'team',
            title: '(3) Equipe',
            description: 'Cadastre seus profissionais',
            isCompleted: (professionalsRes.count || 0) > 0,
            href: '/dashboard/profissionais'
        },
        {
            id: 'links',
            title: '(4) Vincular Profissional',
            description: 'Defina quem atende qual serviço',
            isCompleted: (linksRes.count || 0) > 0,
            href: '/dashboard/profissionais'
        },
        {
            id: 'schedules',
            title: '(5) Horários',
            description: 'Defina a agenda dos profissionais',
            isCompleted: (schedulesRes.count || 0) > 0,
            href: '/dashboard/agenda/disponibilidade'
        },
        {
            id: 'plans',
            title: '(6) Modelos de Planos',
            description: 'Crie seus pacotes ou assinaturas',
            isCompleted: (plansRes.count || 0) > 0,
            href: '/dashboard/planos'
        },
        {
            id: 'customers',
            title: '(7) Primeiro Cliente',
            description: 'Cadastre ou convide alguém',
            isCompleted: (customersRes.count || 0) > 0,
            href: '/dashboard/clientes'
        },
        {
            id: 'customers',
            title: '(Opcional) Anamnese',
            description: 'Defina as perguntas que serão feitas na anamnese',
            isCompleted: (customersRes.count || 0) > 0,
            href: '/dashboard/clientes'
        }
    ]

    const completedCount = steps.filter(s => s.isCompleted).length
    const totalSteps = steps.length
    const percentage = Math.round((completedCount / totalSteps) * 100)

    return {
        steps,
        percentage,
        isFullyCompleted: percentage === 100
    }
}
