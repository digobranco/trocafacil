'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'
import { createClient } from '@/utils/supabase/server'
import { format, parseISO } from 'date-fns'

export type Holiday = {
    id: string
    tenant_id: string | null
    name: string
    start_date: string
    end_date: string
    is_national: boolean
}

export async function getHolidays() {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('holidays')
        .select('*')
        .or(`tenant_id.eq.${ctx.tenantId},is_national.eq.true`)
        .order('start_date', { ascending: true })

    if (error) {
        console.error('Error fetching holidays:', error)
        return []
    }

    return data as Holiday[]
}

export async function createHoliday(data: {
    name: string
    startDate: string
    endDate: string
    repeatTenYears?: boolean
}) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can manage holidays')

    const holidaysToInsert = []

    if (data.repeatTenYears) {
        const start = parseISO(data.startDate)
        const end = parseISO(data.endDate)
        const yearDiff = end.getFullYear() - start.getFullYear()

        for (let i = 0; i < 11; i++) {
            const currentYear = start.getFullYear() + i
            if (currentYear > 2035) break // Safety cap

            const newStart = new Date(start)
            newStart.setFullYear(currentYear)
            
            const newEnd = new Date(end)
            newEnd.setFullYear(currentYear + yearDiff)

            holidaysToInsert.push({
                tenant_id: ctx.tenantId,
                name: data.name,
                start_date: format(newStart, 'yyyy-MM-dd'),
                end_date: format(newEnd, 'yyyy-MM-dd'),
                is_national: false
            })
        }
    } else {
        holidaysToInsert.push({
            tenant_id: ctx.tenantId,
            name: data.name,
            start_date: data.startDate,
            end_date: data.endDate,
            is_national: false
        })
    }

    const { error } = await ctx.supabase
        .from('holidays')
        .insert(holidaysToInsert)

    if (error) {
        console.error('Error creating holiday:', error)
        return { error: 'Falha ao cadastrar feriado/recesso.' }
    }

    revalidatePath('/dashboard/empresa/feriados')
    return { success: true }
}

export async function deleteHoliday(id: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') throw new Error('Only admins can manage holidays')

    const { error } = await ctx.supabase
        .from('holidays')
        .delete()
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId) // Safety check

    if (error) {
        console.error('Error deleting holiday:', error)
        return { error: 'Falha ao excluir feriado.' }
    }

    revalidatePath('/dashboard/empresa/feriados')
    return { success: true }
}

/**
 * Helper to check if a list of dates contains any holidays for a specific tenant
 */
export async function checkHolidays(dates: string[], tenantId: string) {
    const supabase = await createClient()
    
    const { data: holidays } = await supabase
        .from('holidays')
        .select('start_date, end_date, name')
        .or(`tenant_id.eq.${tenantId},is_national.eq.true`)
        .gte('end_date', dates[0])
        .lte('start_date', dates[dates.length - 1])

    if (!holidays || holidays.length === 0) return []

    const holidayConflicts = []

    for (const dateStr of dates) {
        const date = new Date(dateStr)
        const conflict = holidays.find(h => {
            const hStart = new Date(h.start_date)
            const hEnd = new Date(h.end_date)
            return date >= hStart && date <= hEnd
        })
        
        if (conflict) {
            holidayConflicts.push({
                date: dateStr,
                name: conflict.name
            })
        }
    }

    return holidayConflicts
}
