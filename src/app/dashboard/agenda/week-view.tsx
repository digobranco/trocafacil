'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getWeeklyAgenda, DaySummary } from './calendar-actions'
import { cn } from '@/lib/utils'

interface WeekViewProps {
    currentDate: Date
    onSelectDay: (date: Date) => void
    professionalId?: string
    onlyMyAgenda?: boolean
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function WeekView({ currentDate, onSelectDay, professionalId, onlyMyAgenda }: WeekViewProps) {
    const [days, setDays] = useState<DaySummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWeek()
    }, [currentDate])

    async function loadWeek() {
        setLoading(true)
        const data = await getWeeklyAgenda(format(currentDate, 'yyyy-MM-dd'), professionalId)
        setDays(data)
        setLoading(false)
    }

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {days.map((day, index) => {
                const date = addDays(weekStart, index)
                const isToday = format(new Date(), 'yyyy-MM-dd') === day.date
                const isSelected = format(currentDate, 'yyyy-MM-dd') === day.date

                return (
                    <Card
                        key={day.date}
                        className={cn(
                            "cursor-pointer hover:border-primary transition-colors",
                            isSelected && "border-primary border-2",
                            !day.hasAvailability && "opacity-50 bg-muted/30"
                        )}
                        onClick={() => onSelectDay(date)}
                    >
                        <CardContent className="p-3 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                            <div className="flex items-center gap-2 sm:flex-col sm:gap-0 min-w-[60px]">
                                <div className="text-xs text-muted-foreground sm:mb-1">
                                    {DAY_NAMES[index]}
                                </div>
                                <div className={cn(
                                    "text-xl sm:text-2xl font-bold sm:mb-2",
                                    isToday && "text-primary"
                                )}>
                                    {format(date, 'd')}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 sm:flex-col sm:items-center">
                                {day.userAppointmentsCount > 0 && (
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">
                                        {day.userAppointmentsCount === 1 ? 'Meu horário' : `${day.userAppointmentsCount} agend.`}
                                    </Badge>
                                )}
                                {!onlyMyAgenda && (
                                    <>
                                        {day.hasAvailability ? (
                                            <>
                                                {day.appointmentsCount > 0 && (
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                                                        {day.appointmentsCount} {day.appointmentsCount === 1 ? 'sessão' : 'sessões'}
                                                    </Badge>
                                                )}
                                                {day.availableSlots > 0 ? (
                                                    <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                                        {day.availableSlots} {day.availableSlots === 1 ? 'vaga' : 'vagas'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Lotado
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">
                                                Folga
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
