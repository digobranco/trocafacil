'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getMonthlyAgenda, DaySummary } from './calendar-actions'
import { cn } from '@/lib/utils'

interface MonthViewProps {
    currentDate: Date
    onSelectDay: (date: Date) => void
    professionalId?: string
    onlyMyAgenda?: boolean
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MonthView({ currentDate, onSelectDay, professionalId, onlyMyAgenda }: MonthViewProps) {
    const [monthData, setMonthData] = useState<DaySummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMonth()
    }, [currentDate])

    async function loadMonth() {
        setLoading(true)
        const data = await getMonthlyAgenda(format(currentDate, 'yyyy-MM-dd'), professionalId)
        setMonthData(data)
        setLoading(false)
    }

    // Build calendar grid (6 weeks x 7 days)
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    // Create a map for quick lookup
    const dataMap = new Map<string, DaySummary>()
    monthData.forEach(d => dataMap.set(d.date, d))

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map(name => (
                    <div key={name} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {name}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-1">
                {allDays.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd')
                    const data = dataMap.get(dayStr)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dayStr
                    const isSelected = format(currentDate, 'yyyy-MM-dd') === dayStr

                    return (
                        <div
                            key={dayStr}
                            className={cn(
                                "p-2 min-h-[60px] sm:min-h-[80px] border rounded-md cursor-pointer hover:bg-slate-50 transition-colors",
                                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                                isSelected && "border-primary border-2 bg-primary/5",
                                isToday && !isSelected && "border-primary/50",
                                data && !data.hasAvailability && isCurrentMonth && "bg-slate-100"
                            )}
                            onClick={() => onSelectDay(day)}
                        >
                            <div className={cn(
                                "text-sm font-medium mb-1 flex items-center gap-1",
                                isToday && "text-primary font-bold"
                            )}>
                                <span className="sm:hidden text-[10px] text-muted-foreground font-normal">{DAY_NAMES[day.getDay()]}</span>
                                {format(day, 'd')}
                            </div>
                            {data && isCurrentMonth && (
                                <div className="space-y-1">
                                    {data.userAppointmentsCount > 0 && (
                                        <Badge variant="secondary" className="text-[10px] px-1 bg-indigo-100 text-indigo-700 border-indigo-200">
                                            {data.userAppointmentsCount === 1 ? 'Meu horário' : `${data.userAppointmentsCount} agend.`}
                                        </Badge>
                                    )}
                                    {!onlyMyAgenda && (
                                        <>
                                            {data.appointmentsCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] px-1 bg-slate-50 text-slate-600 border-slate-200">
                                                    {data.appointmentsCount} {data.appointmentsCount === 1 ? 'ocupado' : 'ocupados'}
                                                </Badge>
                                            )}
                                            {data.availableSlots > 0 ? (
                                                <Badge variant="outline" className="text-[10px] px-1 text-green-700 border-green-300">
                                                    {data.availableSlots} {data.availableSlots === 1 ? 'vaga' : 'vagas'}
                                                </Badge>
                                            ) : data.appointmentsCount > 0 ? (
                                                <Badge variant="destructive" className="text-[10px] px-1">
                                                    Lotado
                                                </Badge>
                                            ) : null}
                                            {!data.hasAvailability && (
                                                <div className="text-[10px] text-muted-foreground">Folga</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
