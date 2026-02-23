'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getFilteredAppointments, getFilteredOccupancy } from './dashboard-actions'

type FilterType = 'today' | 'tomorrow' | 'week'

const FILTER_LABELS: Record<FilterType, string> = {
    today: 'Hoje',
    tomorrow: 'Amanhã',
    week: 'Próx. Semana',
}

export function DashboardFiltered() {
    const [filter, setFilter] = useState<FilterType>('today')
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState<any[]>([])
    const [occupancy, setOccupancy] = useState<any[]>([])

    useEffect(() => {
        loadData(filter)
    }, [filter])

    async function loadData(f: FilterType) {
        setLoading(true)
        const [appts, occ] = await Promise.all([
            getFilteredAppointments(f),
            getFilteredOccupancy(f),
        ])
        setAppointments(appts)
        setOccupancy(occ)
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2">
                {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className={filter === f ? 'shadow-sm' : ''}
                    >
                        {FILTER_LABELS[f]}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Appointments */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Agendamentos — {FILTER_LABELS[filter]}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointments.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    Nenhum agendamento {filter === 'today' ? 'para hoje' : filter === 'tomorrow' ? 'para amanhã' : 'na próxima semana'}.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {appointments.map((apt) => (
                                        <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{apt.clientName}</p>
                                                <p className="text-xs text-muted-foreground">{apt.serviceName} • {apt.professionalName}</p>
                                            </div>
                                            <div className="text-right">
                                                {filter !== 'today' && (
                                                    <p className="text-xs text-muted-foreground mb-0.5">
                                                        {format(new Date(apt.startTime), 'dd/MM', { locale: ptBR })}
                                                    </p>
                                                )}
                                                <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                                    {format(new Date(apt.startTime), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Occupancy */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                Ocupação — {FILTER_LABELS[filter]}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {occupancy.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    Nenhum profissional com agenda configurada.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {occupancy.map((prof) => (
                                        <div key={prof.id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{prof.name}</span>
                                                <span className="text-muted-foreground">
                                                    {prof.booked}/{prof.capacity} ({prof.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${prof.percentage >= 90 ? 'bg-red-500' :
                                                            prof.percentage >= 60 ? 'bg-amber-500' :
                                                                'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(prof.percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
