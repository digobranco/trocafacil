'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'
import { createClient } from '@/utils/supabase/server'
import { addWeeks } from 'date-fns'
import { randomUUID } from 'crypto'

export type CreateAppointmentData = {
    customerId: string
    professionalId: string
    serviceId: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    recurrence?: 'none' | 'weekly' | 'biweekly'
    recurrenceWeeks?: number
    selectedDays?: number[] // 0-6 (Sun-Sat)
}

export async function createAppointment(data: CreateAppointmentData) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { supabase, tenantId, role } = ctx

    // SECURITY: Validate that the service is actually linked to this professional
    const { data: professionalService, error: psError } = await supabase
        .from('professional_services')
        .select('id')
        .eq('professional_id', data.professionalId)
        .eq('service_id', data.serviceId)
        .eq('is_active', true)
        .maybeSingle()

    if (psError) {
        console.error('Error validating professional service:', psError)
        return { error: 'Erro ao validar serviço do profissional.' }
    }

    if (!professionalService) {
        return { error: 'O serviço selecionado não está disponível para este profissional.' }
    }

    // Get service duration (use custom duration if set, otherwise default)
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
        return { error: 'Serviço não encontrado.' }
    }

    const service = serviceData.services as unknown as { duration_minutes: number }
    const durationMinutes = serviceData.custom_duration_minutes ?? service.duration_minutes

    // Parse date and time
    const [year, month, day] = data.date.split('-').map(Number)
    const [hour, minute] = data.time.split(':').map(Number)
    const baseDate = new Date(year, month - 1, day, hour, minute, 0)

    // Check for past date/time
    if (baseDate < new Date()) {
        return { error: 'Não é possível realizar agendamentos em datas ou horários passados.' }
    }

    const dayOfWeek = baseDate.getDay()

    // Get schedule for this professional/day to check capacity
    const { data: schedules } = await supabase
        .from('schedules')
        .select('max_participants, start_time, end_time, day_of_week')
        .eq('professional_id', data.professionalId)
        .eq('is_active', true)
        .in('day_of_week', data.selectedDays && data.selectedDays.length > 0 ? data.selectedDays : [dayOfWeek])

    if (!schedules || schedules.length === 0) {
        return { error: 'O profissional não tem disponibilidade configurada para os dias selecionados.' }
    }

    // Map schedules by day_of_week for easy lookup
    const scheduleByDay: Record<number, any> = {}
    schedules.forEach(s => {
        const [schedStart] = s.start_time.split(':').map(Number)
        const [schedEnd] = s.end_time.split(':').map(Number)
        if (hour >= schedStart && hour < schedEnd) {
            scheduleByDay[s.day_of_week] = s
        }
    })

    // Validate that all selected days have a matching schedule
    const daysToValidate = data.selectedDays && data.selectedDays.length > 0 ? data.selectedDays : [dayOfWeek]
    for (const day of daysToValidate) {
        if (!scheduleByDay[day]) {
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
            return { error: `O profissional não tem disponibilidade configurada para ${dayNames[day]} às ${data.time}.` }
        }
    }

    // Generate appointments based on recurrence
    const appointments = []
    const groupId = data.recurrence && data.recurrence !== 'none' ? randomUUID() : null

    const weeksToGenerate = data.recurrence === 'none' || !data.recurrence
        ? 1
        : (data.recurrenceWeeks || 12)

    const weekInterval = data.recurrence === 'biweekly' ? 2 : 1

    const targetDays = data.recurrence && data.recurrence !== 'none' && data.selectedDays && data.selectedDays.length > 0
        ? data.selectedDays
        : [dayOfWeek]

    const totalSeries = Math.ceil(weeksToGenerate / weekInterval)
    const totalAppointments = totalSeries * targetDays.length

    // Check credits for client with active membership or customer role
    const { data: creditRow } = await supabase
        .from('credits')
        .select('id, quantity')
        .eq('client_id', data.customerId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

    const availableCredits = creditRow?.quantity || 0
    const hasCredits = availableCredits > 0

    // If client has credits (from plan or manual), validate availability
    if (hasCredits && availableCredits < totalAppointments) {
        return {
            error: `O cliente possui apenas ${availableCredits} crédito(s) disponível(is), mas o agendamento requer ${totalAppointments}.`
        }
    }

    // Customers can't create recurring appointments
    if (role === 'customer' && data.recurrence && data.recurrence !== 'none') {
        return { error: 'Alunos não podem criar agendamentos recorrentes.' }
    }

    for (let i = 0; i < weeksToGenerate; i += weekInterval) {
        const weekBaseDate = addWeeks(baseDate, i)

        for (const day of targetDays) {
            const dayDiff = day - dayOfWeek
            const startTime = new Date(weekBaseDate)
            startTime.setDate(startTime.getDate() + dayDiff)

            if (startTime < new Date()) continue

            const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

            appointments.push({
                tenant_id: tenantId,
                client_id: data.customerId,
                professional_id: data.professionalId,
                service_id: data.serviceId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'scheduled',
                type: data.recurrence === 'none' || !data.recurrence ? 'single' : 'recurring',
                recurring_group_id: groupId
            })
        }
    }

    // Check for capacity
    for (const apt of appointments) {
        const aptDate = new Date(apt.start_time)
        const aptHour = aptDate.getHours()

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
        const maxParticipants = scheduleByDay[aptDate.getDay()]?.max_participants || 1

        if (currentCount >= maxParticipants) {
            return {
                error: `Horário lotado para ${aptDate.toLocaleDateString('pt-BR')} às ${String(aptHour).padStart(2, '0')}:00. Capacidade: ${currentCount}/${maxParticipants}.`
            }
        }

        const { data: customerConflict } = await supabase
            .from('appointments')
            .select('id')
            .eq('client_id', data.customerId)
            .eq('start_time', apt.start_time)
            .eq('status', 'scheduled')
            .maybeSingle()

        if (customerConflict) {
            return {
                error: `O cliente já possui um agendamento marcado para ${aptDate.toLocaleDateString('pt-BR')} às ${data.time}.`
            }
        }
    }

    // Insert all appointments
    const { error: insertError } = await supabase
        .from('appointments')
        .insert(appointments)

    if (insertError) {
        console.error('Error creating appointment:', insertError)
        return { error: 'Falha ao criar agendamento.' }
    }

    // Deduct credits if client has credits (from plan or manual)
    if (hasCredits && creditRow) {
        await supabase
            .from('credits')
            .update({ quantity: Math.max(0, (creditRow.quantity || 0) - appointments.length) })
            .eq('id', creditRow.id)

        await supabase.from('credit_logs').insert({
            tenant_id: tenantId,
            client_id: data.customerId,
            quantity_change: -appointments.length,
            type: 'usage',
            notes: `Consumido em agendamento (${appointments.length} aula(s))`
        })
    }

    revalidatePath('/dashboard/agenda')
    revalidatePath(`/dashboard/clientes/${data.customerId}`)
    return { success: true, count: appointments.length }
}

export async function cancelAppointment(appointmentId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { error } = await ctx.supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

    if (error) {
        console.error('Error cancelling appointment:', error)
        return { error: 'Falha ao cancelar agendamento.' }
    }

    revalidatePath('/dashboard/agenda')
    return { success: true }
}

export async function deleteAppointment(appointmentId: string, scope: 'single' | 'series') {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    const { supabase, role } = ctx

    // 1. Get appointment details first to check for credit generation
    const { data: appointment } = await supabase
        .from('appointments')
        .select(`
            id, 
            tenant_id, 
            client_id, 
            start_time, 
            recurring_group_id,
            tenants (
                cancellation_window_hours,
                credit_validity_days
            )
        `)
        .eq('id', appointmentId)
        .single()

    if (!appointment) return { error: 'Agendamento não encontrado.' }

    // 2. Logic for credit generation
    const startTime = new Date(appointment.start_time)
    const now = new Date()
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // @ts-ignore - Supabase join types can be tricky
    const windowHours = appointment.tenants?.cancellation_window_hours ?? 24
    // @ts-ignore
    const validityDays = appointment.tenants?.credit_validity_days ?? 30

    const shouldGenerateCredit = diffHours >= windowHours

    if (scope === 'series') {
        if (role === 'customer') {
            return { error: 'Alunos não possuem permissão para excluir séries de agendamentos.' }
        }

        if (appointment.recurring_group_id) {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('recurring_group_id', appointment.recurring_group_id)

            if (error) {
                console.error('Error deleting appointment series:', error)
                return { error: 'Falha ao excluir série de agendamentos.' }
            }
        } else {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId)

            if (error) {
                console.error('Error deleting appointment:', error)
                return { error: 'Falha ao excluir agendamento.' }
            }
        }
    } else {
        // Single deletion
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId)

        if (error) {
            console.error('Error deleting appointment:', error)
            return { error: 'Falha ao excluir agendamento.' }
        }

        // 3. Generate credit if applicable
        if (shouldGenerateCredit && appointment.client_id) {
            const validUntil = new Date()
            validUntil.setDate(validUntil.getDate() + validityDays)

            const { data: existingCredit } = await supabase
                .from('credits')
                .select('id, quantity')
                .eq('client_id', appointment.client_id)
                .eq('tenant_id', appointment.tenant_id)
                .maybeSingle()

            if (existingCredit) {
                await supabase
                    .from('credits')
                    .update({
                        quantity: (existingCredit.quantity || 0) + 1,
                        valid_until: validUntil.toISOString()
                    })
                    .eq('id', existingCredit.id)

                await supabase.from('credit_logs').insert({
                    tenant_id: appointment.tenant_id,
                    client_id: appointment.client_id,
                    quantity_change: 1,
                    type: 'cancellation_refund',
                    notes: 'Estorno por cancelamento antecipado'
                })
            } else {
                await supabase
                    .from('credits')
                    .insert({
                        tenant_id: appointment.tenant_id,
                        client_id: appointment.client_id,
                        quantity: 1,
                        valid_until: validUntil.toISOString()
                    })

                await supabase.from('credit_logs').insert({
                    tenant_id: appointment.tenant_id,
                    client_id: appointment.client_id,
                    quantity_change: 1,
                    type: 'cancellation_refund',
                    notes: 'Crédito inicial por cancelamento antecipado'
                })
            }
        }
    }

    revalidatePath('/dashboard/agenda')
    return {
        success: true,
        creditGenerated: shouldGenerateCredit && scope === 'single'
    }
}

// Fetch data for appointment form — uses auth context for single auth call
export async function getAppointmentFormData() {
    const ctx = await getAuthContext()
    if (!ctx) return { customers: [], professionals: [], services: [] }

    // Fetch all 3 lists in PARALLEL
    const [customersRes, professionalsRes, servicesRes] = await Promise.all([
        ctx.supabase.from('customers').select('id, full_name').eq('tenant_id', ctx.tenantId).eq('active', true),
        ctx.supabase.from('professionals').select('id, name').eq('tenant_id', ctx.tenantId).eq('active', true),
        ctx.supabase.from('services').select('id, name, duration_minutes').eq('tenant_id', ctx.tenantId).eq('active', true)
    ])

    return {
        customers: customersRes.data || [],
        professionals: professionalsRes.data || [],
        services: servicesRes.data || []
    }
}

export async function updateAppointmentStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'absent') {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role === 'customer') throw new Error('Unauthorized')

    const { error } = await ctx.supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error updating appointment status:', error)
        return { error: 'Falha ao atualizar status do agendamento.' }
    }

    revalidatePath('/dashboard/agenda')
    return { success: true }
}

export async function getSlotAppointments(startTime: string, professionalId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')

    // startTime comes in format: '2026-02-17T08:00:00' (no timezone specified)
    // Node.js server is running in BRT (UTC-3), so new Date() interprets this as BRT
    // and automatically converts to UTC: 08:00 BRT → 11:00 UTC
    // We don't need to add the offset manually!

    const startDate = new Date(startTime)
    const endDate = new Date(startDate.getTime() + 59 * 60 * 1000 + 59 * 1000) // Add 59:59



    const { data, error } = await ctx.supabase
        .from('appointments')
        .select(`
            *,
            client:client_id(id, full_name),
            service:service_id(name),
            professional:professional_id(id, name),
            evolution:evolutions(id, content, created_at)
        `)
        .eq('tenant_id', ctx.tenantId)
        .eq('professional_id', professionalId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('created_at', { ascending: true })



    if (error) {
        console.error('Error fetching slot appointments:', error)
        return []
    }

    return data
}
