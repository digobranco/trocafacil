'use client'

import { useState, useEffect } from 'react'
import { getCustomerAppointments } from './actions'
import { format, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Calendar,
    Clock,
    User as UserIcon,
    Briefcase,
    CalendarClock,
    AlertTriangle,
    Plus,
    CalendarDays,
    CheckSquare,
    Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { deleteAppointment } from '../agenda/appointment-actions'
import { AppointmentDialog } from '../agenda/appointment-dialog'
import { AppointmentDetailsDialog } from '../agenda/appointment-details-dialog'
import Link from 'next/link'
import {
    Dialog as CustomDialog,
    DialogContent as CustomDialogContent,
    DialogDescription as CustomDialogDescription,
    DialogFooter as CustomDialogFooter,
    DialogHeader as CustomDialogHeader,
    DialogTitle as CustomDialogTitle,
} from "@/components/ui/dialog"

interface CustomerAppointmentsProps {
    customerId: string
}

export function CustomerAppointments({ customerId }: CustomerAppointmentsProps) {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isRecurring, setIsRecurring] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, professionalId: string, date: string } | null>(null)

    useEffect(() => {
        loadAppointments()
        window.addEventListener('appointment-updated', loadAppointments)
        return () => window.removeEventListener('appointment-updated', loadAppointments)
    }, [customerId])

    async function loadAppointments() {
        setLoading(true)
        try {
            const data = await getCustomerAppointments(customerId)
            setAppointments(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(scope: 'single' | 'series') {
        if (!deletingId) return

        try {
            const res = await deleteAppointment(deletingId, scope)
            if (res.success) {
                const creditMsg = res.creditGenerated
                    ? '\n\nUm crédito de reposição foi gerado conforme a política de cancelamento.'
                    : '\n\nCancelamento realizado fora do prazo. Nenhum crédito foi gerado.'

                alert(`Agendamento excluído com sucesso!${creditMsg}`)
                loadAppointments()
                window.dispatchEvent(new CustomEvent('credit-updated'))
            } else {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir agendamento.')
        } finally {
            setShowDeleteDialog(false)
            setDeletingId(null)
        }
    }

    const upcoming = appointments.filter(app => isAfter(new Date(app.start_time), new Date()) && app.status === 'scheduled').sort((a, b) => a.start_time.localeCompare(b.start_time))
    const past = appointments.filter(app => !isAfter(new Date(app.start_time), new Date()) || app.status !== 'scheduled').sort((a, b) => b.start_time.localeCompare(a.start_time))

    if (loading) {
        return <div className="py-8 text-center text-sm text-muted-foreground">Carregando agendamentos...</div>
    }

    const getStatusBorder = (status: string) => {
        if (status === 'completed') return 'border-l-green-500'
        if (status === 'absent') return 'border-l-red-500'
        return 'border-l-indigo-500'
    }

    const getStatusLabel = (status: string) => {
        if (status === 'completed') return <Badge className="text-[10px] bg-green-600">Presente</Badge>
        if (status === 'absent') return <Badge variant="destructive" className="text-[10px]">Falta</Badge>
        if (status === 'cancelled') return <Badge variant="destructive" className="text-[10px] uppercase">Cancelado</Badge>
        return null
    }

    const renderAppointmentCard = (app: any) => (
        <Card key={app.id} className={`border-l-4 ${getStatusBorder(app.status)} overflow-hidden`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {format(new Date(app.start_time), "dd 'de' MMMM", { locale: ptBR })}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(app.start_time), "HH:mm")}
                            </Badge>
                            {app.type === 'recurring' && (
                                <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">RECORRENTE</Badge>
                            )}
                            {getStatusLabel(app.status)}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-start gap-2 text-sm text-slate-600 min-w-0">
                                <Briefcase className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <span className="font-medium break-all">{app.service?.name || 'Sessão'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-600 min-w-0">
                                <UserIcon className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <span className="break-all">{app.professional?.name || 'Profissional'}</span>
                            </div>
                        </div>
                    </div>

                    {app.status === 'scheduled' && (
                        <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                            <Link href={`/dashboard/agenda/horario?start=${encodeURIComponent(app.start_time)}&prof=${app.professional_id}`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                >
                                    <Eye className="h-4 w-4" />
                                    Detalhes
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={() => {
                                    setSelectedSlot({
                                        time: format(new Date(app.start_time), "HH:mm"),
                                        professionalId: app.professional_id,
                                        date: format(new Date(app.start_time), 'yyyy-MM-dd')
                                    })
                                    setDetailsOpen(true)
                                }}
                            >
                                <CheckSquare className="h-4 w-4" />
                                Presença
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    setDeletingId(app.id)
                                    setIsRecurring(app.type === 'recurring')
                                    setShowDeleteDialog(true)
                                }}
                            >
                                <CalendarClock className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Histórico de Sessões</h4>
                <AppointmentDialog
                    customerId={customerId}
                    onSuccess={loadAppointments}
                    trigger={
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Horário
                        </Button>
                    }
                />
            </div>

            {appointments.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nenhum agendamento encontrado.</p>
                    <p className="text-xs text-slate-400 mt-1">Este cliente ainda não possui sessões marcadas.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {upcoming.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                Próximos Agendamentos
                            </div>
                            <div className="grid gap-3">
                                {upcoming.map(renderAppointmentCard)}
                            </div>
                        </div>
                    )}

                    {past.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                                <div className="w-1 h-4 bg-slate-400 rounded-full" />
                                Sessões Passadas
                            </div>
                            <div className="grid gap-3 opacity-80">
                                {past.map(renderAppointmentCard)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <CustomDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <CustomDialogContent>
                    <CustomDialogHeader>
                        <CustomDialogTitle className="flex items-center gap-2 text-indigo-600">
                            <CalendarClock className="h-5 w-5" />
                            Cancelar / Remarcar Horário
                        </CustomDialogTitle>
                        <CustomDialogDescription>
                            {isRecurring
                                ? "Este agendamento faz parte de uma recorrência. O que você deseja cancelar?"
                                : "Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."}
                        </CustomDialogDescription>
                    </CustomDialogHeader>
                    <CustomDialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleDelete('single')}
                        >
                            Cancelar apenas este
                        </Button>
                        {isRecurring && (
                            <Button
                                variant="destructive"
                                onClick={() => handleDelete('series')}
                            >
                                Cancelar toda a série
                            </Button>
                        )}
                    </CustomDialogFooter>
                </CustomDialogContent>
            </CustomDialog>

            {selectedSlot && (
                <AppointmentDetailsDialog
                    startTime={selectedSlot.date + 'T' + selectedSlot.time + ':00'}
                    professionalId={selectedSlot.professionalId}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    onSuccess={loadAppointments}
                />
            )}
        </div>
    )
}
