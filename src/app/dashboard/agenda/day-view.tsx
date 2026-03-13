'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getAgendaPageData, getDailyAgenda, AgendaSlot } from './actions'
import { Button } from '@/components/ui/button'
import { AppointmentDialog } from './appointment-dialog'
import { User as UserIcon, Briefcase, Clock, Users, CalendarClock, AlertTriangle, CheckSquare, Eye } from 'lucide-react'
import { AppointmentDetailsDialog } from './appointment-details-dialog'
import { deleteAppointment } from './appointment-actions'
import Link from 'next/link'
import {
    Dialog as CustomDialog,
    DialogContent as CustomDialogContent,
    DialogDescription as CustomDialogDescription,
    DialogFooter as CustomDialogFooter,
    DialogHeader as CustomDialogHeader,
    DialogTitle as CustomDialogTitle,
} from "@/components/ui/dialog"

interface DayViewProps {
    currentDate: Date
    onRefresh?: () => void
    professionalId?: string
    onlyMyAgenda?: boolean
}

export function DayView({ currentDate, onRefresh, professionalId, onlyMyAgenda }: DayViewProps) {
    const [slots, setSlots] = useState<AgendaSlot[]>([])
    const [loading, setLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [credits, setCredits] = useState<number>(0)
    const [holiday, setHoliday] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [isRecurring, setIsRecurring] = useState(false)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, professionalId: string } | null>(null)

    useEffect(() => {
        loadAgenda()
    }, [currentDate])

    async function loadAgenda() {
        setLoading(true)
        try {
            // Single merged call: 1 auth instead of 3
            const data = await getAgendaPageData(format(currentDate, 'yyyy-MM-dd'), professionalId)
            setCurrentUser(data.user)
            setCredits(data.credits)
            setSlots(data.slots)
            setHoliday(data.holiday)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Smart re-fetch: only reload agenda data on mutations (keep cached user/credits)
    async function refreshAgendaOnly() {
        try {
            const agendaData = await getDailyAgenda(format(currentDate, 'yyyy-MM-dd'), professionalId)
            setSlots(agendaData)
        } catch (error) {
            console.error(error)
        }
    }

    function handleSuccess() {
        refreshAgendaOnly()
        onRefresh?.()
    }

    async function handleCancel(scope: 'single' | 'series') {
        if (!cancellingId) return

        try {
            const res = await deleteAppointment(cancellingId, scope)
            if (res.success) {
                const creditMsg = res.creditGenerated
                    ? '\n\nUm crédito de reposição foi gerado conforme a política de cancelamento.'
                    : '\n\nCancelamento realizado fora do prazo. Nenhum crédito foi gerado.'

                alert(`Cancelamento realizado com sucesso!${currentUser?.role === 'customer' ? creditMsg : ''}`)
                loadAgenda()
                onRefresh?.()
            } else {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao cancelar agendamento.')
        } finally {
            setShowCancelDialog(false)
            setCancellingId(null)
        }
    }

    // Pre-filtering slots if in My Agenda mode
    const displayedSlots = onlyMyAgenda
        ? slots.filter(slot => slot.appointments.some(app =>
            currentUser?.role === 'customer'
                ? app.client_id === currentUser?.customer_id
                : app.professional_id === (currentUser?.professional_id || professionalId)
        ))
        : slots

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando horários...</div>
    }

    if (slots.length === 0) {
        return (
            <div className="p-8 text-center border rounded-md bg-slate-50 text-muted-foreground">
                Nenhum horário disponível configurado para este dia.
            </div>
        )
    }

    if (onlyMyAgenda && displayedSlots.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed rounded-md bg-indigo-50/30 text-indigo-600/60 font-medium">
                Você não possui compromissos agendados para este dia.
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'free': return 'bg-green-50 border-l-green-500'
            case 'partial': return 'bg-amber-50 border-l-amber-500'
            case 'busy': return 'bg-red-50 border-l-red-500'
            default: return ''
        }
    }

    const getStatusBadge = (slot: AgendaSlot) => {
        if (slot.status === 'busy') {
            return <Badge variant="destructive" className="text-xs">Lotado</Badge>
        } else if (slot.status === 'partial') {
            return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                {slot.maxParticipants - slot.currentCount} {slot.maxParticipants - slot.currentCount === 1 ? 'vaga' : 'vagas'}
            </Badge>
        } else {
            return <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                {slot.maxParticipants} {slot.maxParticipants === 1 ? 'vaga' : 'vagas'}
            </Badge>
        }
    }

    return (
        <div className="grid gap-3">
            {holiday && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 mb-2 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    Hoje é feriado/recesso: {holiday}. Novos agendamentos estão bloqueados.
                </div>
            )}
            {displayedSlots.map((slot, index) => (
                <Card key={index} className={`border-l-4 ${getStatusColor(slot.status)}`}>
                    <CardHeader className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {slot.time}
                            </CardTitle>
                            {slot.professionalName && (
                                <span className="text-sm text-purple-600 font-medium truncate max-w-[120px] sm:max-w-none">
                                    {slot.professionalName}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {slot.currentCount}/{slot.maxParticipants}
                            </div>
                            {getStatusBadge(slot)}
                            {slot.appointments.length > 0 && currentUser?.role !== 'customer' && (
                                <>
                                    <Link href={`/dashboard/agenda/horario?start=${encodeURIComponent(format(currentDate, 'yyyy-MM-dd') + 'T' + slot.time + ':00')}&prof=${slot.professionalId || professionalId || ''}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 sm:h-8 gap-1 text-xs bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        >
                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Detalhes
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 sm:h-8 gap-1 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedSlot({ time: slot.time, professionalId: slot.professionalId || professionalId || '' })
                                            setDetailsOpen(true)
                                        }}
                                    >
                                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Presença
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                        {/* Show existing appointments */}
                        {slot.appointments.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {slot.appointments.map((app, i) => {
                                    const isOwner = currentUser?.role === 'customer'
                                        ? app.client_id === currentUser?.customer_id
                                        : app.professional_id === (currentUser?.professional_id || professionalId)
                                    const isCustomer = currentUser?.role === 'customer'
                                    const canSeeDetails = !isCustomer || isOwner

                                    // If onlyMyAgenda is true, skip other people's appointments in the same slot
                                    if (onlyMyAgenda && !isOwner) return null

                                    const statusBg = app.status === 'completed'
                                        ? 'bg-green-50 border-green-300'
                                        : app.status === 'absent'
                                            ? 'bg-red-50 border-red-300'
                                            : isOwner
                                                ? 'bg-indigo-100 border-indigo-200 shadow-sm'
                                                : 'bg-slate-50 border-slate-100'

                                    return (
                                        <div key={i} className={`p-3 rounded-lg text-sm border ${statusBg}`}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <Briefcase className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                                        <span className="font-semibold text-indigo-700 break-all">
                                                            {app.service?.name || 'Sessão'}
                                                        </span>
                                                        {isOwner && (
                                                            <Badge variant="outline" className="text-[10px] uppercase bg-white text-indigo-600 border-indigo-200 shrink-0">Meu Horário</Badge>
                                                        )}
                                                        {app.status === 'completed' && (
                                                            <Badge className="text-[10px] bg-green-600 shrink-0">Presente</Badge>
                                                        )}
                                                        {app.status === 'absent' && (
                                                            <Badge variant="destructive" className="text-[10px] shrink-0">Falta</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {canSeeDetails && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                setCancellingId(app.id)
                                                                setIsRecurring(app.type === 'recurring')
                                                                setShowCancelDialog(true)
                                                            }}
                                                            title="Cancelar / Remarcar"
                                                        >
                                                            <CalendarClock className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 min-w-0">
                                                <UserIcon className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    {canSeeDetails ? (
                                                        <Link href={`/dashboard/clientes/${app.client_id}`} className="text-indigo-700 hover:underline font-medium break-all block">
                                                            {app.client?.full_name || 'Cliente'}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-700 break-all block">Ocupado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Show add button if not full AND not in My Agenda mode AND not a holiday */}
                        {!onlyMyAgenda && slot.status !== 'busy' && !holiday && (
                            <AppointmentDialog
                                selectedDate={currentDate}
                                selectedTime={slot.time}
                                defaultProfessionalId={slot.professionalId || professionalId}
                                onSuccess={handleSuccess}
                                disabled={currentUser?.role === 'customer' && credits <= 0}
                                trigger={
                                    <div className={cn(
                                        "text-sm p-2 text-center border-2 border-dashed rounded-md transition-colors font-medium",
                                        (currentUser?.role === 'customer' && credits <= 0)
                                            ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed"
                                            : "text-indigo-600 border-indigo-200 cursor-pointer hover:bg-indigo-50"
                                    )}>
                                        {(currentUser?.role === 'customer' && credits <= 0)
                                            ? 'Créditos Insuficientes'
                                            : (currentUser?.role === 'customer' ? '+ Agendar meu horário' : '+ Adicionar agendamento')
                                        } ({slot.maxParticipants - slot.currentCount} {slot.maxParticipants - slot.currentCount === 1 ? 'vaga' : 'vagas'})
                                    </div>
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            ))}

            <CustomDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <CustomDialogContent>
                    <CustomDialogHeader>
                        <CustomDialogTitle className="flex items-center gap-2 text-indigo-600">
                            <CalendarClock className="h-5 w-5" />
                            Cancelar / Remarcar Horário
                        </CustomDialogTitle>
                        <CustomDialogDescription>
                            {isRecurring
                                ? "Este agendamento faz parte de uma recorrência. O que você deseja cancelar?"
                                : "Tem certeza que deseja cancelar este agendamento? Se estiver dentro do prazo, você receberá um crédito de reposição."}
                        </CustomDialogDescription>
                    </CustomDialogHeader>
                    <CustomDialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleCancel('single')}
                        >
                            Cancelar apenas este
                        </Button>
                        {isRecurring && currentUser?.role !== 'customer' && (
                            <Button
                                variant="destructive"
                                onClick={() => handleCancel('series')}
                            >
                                Cancelar toda a série
                            </Button>
                        )}
                    </CustomDialogFooter>
                </CustomDialogContent>
            </CustomDialog>

            {selectedSlot && (
                <AppointmentDetailsDialog
                    startTime={format(currentDate, 'yyyy-MM-dd') + 'T' + selectedSlot.time + ':00'}
                    professionalId={selectedSlot.professionalId}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
