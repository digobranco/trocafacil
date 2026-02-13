'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    getSlotAppointments,
    updateAppointmentStatus
} from '../appointment-actions'
import { addEvolution, saveBatchEvolutions } from '../../clientes/clinical-actions'
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
    ArrowLeft,
    Briefcase
} from 'lucide-react'

function SlotDetailsContent({ startTime, professionalId }: { startTime: string, professionalId: string }) {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [evolutionContent, setEvolutionContent] = useState<Record<string, string>>({})
    const [batchEvolution, setBatchEvolution] = useState('')
    const [showBatchEvolution, setShowBatchEvolution] = useState(false)

    useEffect(() => {
        loadData()
    }, [startTime, professionalId])

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
    const dateLabel = startTime ? format(new Date(startTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''
    const profName = appointments[0]?.professional?.name || ''

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" />
                <p className="mt-3 text-sm text-muted-foreground">Carregando participantes...</p>
            </div>
        )
    }

    const getCardBg = (status: string) => {
        if (status === 'completed') return 'border-green-300 bg-green-50/70'
        if (status === 'absent') return 'border-red-300 bg-red-50/70'
        return 'border-slate-200 bg-white'
    }

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                        <Clock className="h-6 w-6 text-indigo-500" />
                        {timeLabel}
                    </div>
                    <p className="text-sm text-slate-500 capitalize">{dateLabel}</p>
                    {profName && (
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                            <Briefcase className="h-4 w-4" />
                            {profName}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold text-lg text-slate-700">{appointments.length}</span> participante{appointments.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Bulk Actions */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ações em Lote:</span>
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
                </CardContent>
            </Card>

            {showBatchEvolution && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardContent className="p-4 space-y-3">
                        <h5 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Evolução Coletiva — será salva para todos os {appointments.length} participantes
                        </h5>
                        <Textarea
                            placeholder="Escreva uma evolução que será replicada para todos os participantes deste horário..."
                            value={batchEvolution}
                            onChange={(e) => setBatchEvolution(e.target.value)}
                            className="bg-white min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setShowBatchEvolution(false)}>Cancelar</Button>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveBatchEvolution} disabled={saving || !batchEvolution.trim()}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                Salvar para Todos
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Participants */}
            <div className="space-y-4">
                {appointments.map((app) => (
                    <Card key={app.id} className={`transition-all duration-300 ${getCardBg(app.status)}`}>
                        <CardContent className="p-5 space-y-4">
                            {/* Participant header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${app.status === 'completed' ? 'bg-green-100' : app.status === 'absent' ? 'bg-red-100' : 'bg-slate-100'
                                        }`}>
                                        {app.status === 'completed'
                                            ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                                            : app.status === 'absent'
                                                ? <XCircle className="h-6 w-6 text-red-600" />
                                                : <UserIcon className="h-6 w-6 text-slate-400" />
                                        }
                                    </div>
                                    <div>
                                        <Link href={`/dashboard/clientes/${app.client_id}`} className="font-bold text-slate-800 hover:text-indigo-700 hover:underline text-base">
                                            {app.client?.full_name || 'Cliente'}
                                        </Link>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {app.service?.name || 'Sessão'}
                                        </p>
                                    </div>
                                </div>

                                {/* Attendance toggle */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <Button
                                        size="sm"
                                        variant={app.status === 'completed' ? 'default' : 'ghost'}
                                        className={app.status === 'completed' ? 'bg-green-600 hover:bg-green-700 h-9 px-3 gap-1' : 'h-9 px-3 text-slate-400 hover:text-green-600 gap-1'}
                                        onClick={() => handleStatusUpdate(app.id, app.status === 'completed' ? 'scheduled' : 'completed')}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="text-xs">Presente</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={app.status === 'absent' ? 'destructive' : 'ghost'}
                                        className={app.status === 'absent' ? 'bg-red-600 hover:bg-red-700 h-9 px-3 gap-1' : 'h-9 px-3 text-slate-400 hover:text-red-600 gap-1'}
                                        onClick={() => handleStatusUpdate(app.id, app.status === 'absent' ? 'scheduled' : 'absent')}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="text-xs">Falta</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Evolution */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        Evolução Clínica
                                    </label>
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
                                        className="min-h-[100px] text-sm bg-white"
                                    />
                                    <Button
                                        size="sm"
                                        className="absolute bottom-2 right-2 h-8 px-3 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => handleSaveEvolution(app.id, app.client_id)}
                                        disabled={saving || !evolutionContent[app.id]}
                                    >
                                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {appointments.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nenhum participante neste horário.</p>
                </div>
            )}
        </div>
    )
}

export default function HorarioPage() {
    const searchParams = useSearchParams()
    const startTime = searchParams.get('start') || ''
    const professionalId = searchParams.get('prof') || ''

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/agenda">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar à Agenda
                    </Button>
                </Link>
                <h2 className="text-xl font-bold text-slate-800">Detalhes do Horário</h2>
            </div>

            <SlotDetailsContent startTime={startTime} professionalId={professionalId} />
        </div>
    )
}
