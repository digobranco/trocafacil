'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    getSlotAppointments,
    updateAppointmentStatus
} from './appointment-actions'
import { addEvolution, saveBatchEvolutions } from '../clientes/clinical-actions'
import {
    CheckCircle2,
    XCircle,
    MessageSquare,
    Users,
    Check,
    X,
    User as UserIcon,
    Loader2,
    Clock,
    Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AppointmentDetailsDialogProps {
    startTime: string
    professionalId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function AppointmentDetailsDialog({
    startTime,
    professionalId,
    open,
    onOpenChange,
    onSuccess
}: AppointmentDetailsDialogProps) {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [evolutionContent, setEvolutionContent] = useState<Record<string, string>>({})
    const [batchEvolution, setBatchEvolution] = useState('')
    const [showBatchEvolution, setShowBatchEvolution] = useState(false)

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, startTime, professionalId])

    async function loadData() {
        setLoading(true)
        try {
            const data = await getSlotAppointments(startTime, professionalId)
            setAppointments(data)
            const existingEvolutions: Record<string, string> = {}
            data.forEach((app: any) => {
                if (app.evolution?.[0]) {
                    existingEvolutions[app.id] = app.evolution[0].content
                }
            })
            setEvolutionContent(existingEvolutions)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate(id: string, status: 'completed' | 'absent' | 'scheduled') {
        try {
            const res = await updateAppointmentStatus(id, status)
            if (res.success) {
                setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app))
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleBulkStatus(status: 'completed' | 'absent') {
        setSaving(true)
        try {
            await Promise.all(appointments.map(app => updateAppointmentStatus(app.id, status)))
            setAppointments(prev => prev.map(app => ({ ...app, status })))
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveEvolution(id: string, clientId: string) {
        setSaving(true)
        try {
            const res = await addEvolution(clientId, evolutionContent[id] || '', id)
            if (res.success) {
                loadData()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveBatchEvolution() {
        if (!batchEvolution.trim()) return
        setSaving(true)
        try {
            const payload = appointments.map(app => ({
                clientId: app.client_id,
                appointmentId: app.id,
                content: batchEvolution
            }))
            const res = await saveBatchEvolutions(payload)
            if (res.success) {
                setBatchEvolution('')
                setShowBatchEvolution(false)
                loadData()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const timeLabel = startTime ? format(new Date(startTime), "HH:mm") : ''

    const getCardBg = (status: string) => {
        if (status === 'completed') return 'border-green-300 bg-green-50/70'
        if (status === 'absent') return 'border-red-300 bg-red-50/70'
        return 'border-slate-200 bg-white'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        Presença — {timeLabel}
                    </DialogTitle>
                    <DialogDescription>
                        Controle de presença e evolução clínica dos participantes.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                        <p className="mt-2 text-sm text-muted-foreground">Carregando informações...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Bulk Actions */}
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Ações em Lote:</span>
                            <Button size="sm" variant="outline" className="bg-white hover:bg-green-50 text-green-700 border-green-200" onClick={() => handleBulkStatus('completed')} disabled={saving}>
                                <Check className="h-4 w-4 mr-1" /> Todos Presentes
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200" onClick={() => handleBulkStatus('absent')} disabled={saving}>
                                <X className="h-4 w-4 mr-1" /> Todos Ausentes
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200" onClick={() => setShowBatchEvolution(!showBatchEvolution)} disabled={saving}>
                                <MessageSquare className="h-4 w-4 mr-1" /> Evolução Coletiva
                            </Button>
                        </div>

                        {showBatchEvolution && (
                            <div className="space-y-3 p-4 border rounded-lg bg-indigo-50/50 border-indigo-100">
                                <h5 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Evolução Coletiva
                                </h5>
                                <Textarea
                                    placeholder="Escreva uma evolução que será replicada para todos os participantes..."
                                    value={batchEvolution}
                                    onChange={(e) => setBatchEvolution(e.target.value)}
                                    className="bg-white"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setShowBatchEvolution(false)}>Cancelar</Button>
                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveBatchEvolution} disabled={saving || !batchEvolution.trim()}>
                                        Salvar para Todos
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Participants */}
                        <div className="space-y-3">
                            {appointments.map((app) => (
                                <div key={app.id} className={`p-4 border rounded-xl space-y-3 transition-all duration-300 ${getCardBg(app.status)}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${app.status === 'completed' ? 'bg-green-100' : app.status === 'absent' ? 'bg-red-100' : 'bg-slate-100'
                                                }`}>
                                                {app.status === 'completed'
                                                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    : app.status === 'absent'
                                                        ? <XCircle className="h-5 w-5 text-red-600" />
                                                        : <UserIcon className="h-5 w-5 text-slate-400" />
                                                }
                                            </div>
                                            <div>
                                                <Link href={`/dashboard/clientes/${app.client_id}`} className="font-bold text-slate-800 hover:text-indigo-700 hover:underline">
                                                    {app.client?.full_name || 'Cliente'}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{app.service?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                            <Button
                                                size="sm"
                                                variant={app.status === 'completed' ? 'default' : 'ghost'}
                                                className={app.status === 'completed' ? 'bg-green-600 hover:bg-green-700 h-8 px-2' : 'h-8 px-2 text-slate-400 hover:text-green-600'}
                                                onClick={() => handleStatusUpdate(app.id, app.status === 'completed' ? 'scheduled' : 'completed')}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={app.status === 'absent' ? 'destructive' : 'ghost'}
                                                className={app.status === 'absent' ? 'bg-red-600 hover:bg-red-700 h-8 px-2' : 'h-8 px-2 text-slate-400 hover:text-red-600'}
                                                onClick={() => handleStatusUpdate(app.id, app.status === 'absent' ? 'scheduled' : 'absent')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Evolução Clínica</label>
                                            {app.evolution?.length > 0 && (
                                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                                    Salvo em {format(new Date(app.evolution[0].created_at || new Date()), "dd/MM 'às' HH:mm")}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Textarea
                                                placeholder="Descreva o atendimento, progresso ou observações..."
                                                value={evolutionContent[app.id] || ''}
                                                onChange={(e) => setEvolutionContent(prev => ({ ...prev, [app.id]: e.target.value }))}
                                                className="min-h-[80px] text-sm bg-white"
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="absolute bottom-2 right-2 h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => handleSaveEvolution(app.id, app.client_id)}
                                                disabled={saving || !evolutionContent[app.id]}
                                            >
                                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                        onSuccess?.()
                        onOpenChange(false)
                    }}>Concluído</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
