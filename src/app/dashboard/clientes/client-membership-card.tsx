'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, XCircle, Loader2, CalendarDays, Clock, User } from 'lucide-react'
import { getActiveClientMembership, cancelClientMembership, type ClientMembership } from '../planos/actions'
import { getPlanTypeLabel } from '../planos/utils'
import { MembershipDialog } from './membership-dialog'
import { format } from 'date-fns'

interface ClientMembershipCardProps {
    clientId: string
    clientName: string
}

export function ClientMembershipCard({ clientId, clientName }: ClientMembershipCardProps) {
    const [membership, setMembership] = useState<ClientMembership | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        loadMembership()
    }, [clientId])

    async function loadMembership() {
        setLoading(true)
        const data = await getActiveClientMembership(clientId)
        setMembership(data)
        setLoading(false)
    }

    async function handleCancel() {
        if (!membership) return
        if (!confirm('Cancelar o plano deste cliente? Os agendamentos futuros do plano serão mantidos.')) return

        setCancelling(true)
        const res = await cancelClientMembership(membership.id)
        setCancelling(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert('Plano cancelado com sucesso.')
            loadMembership()
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center p-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    const plan = membership?.membership_plans

    return (
        <Card className="border-blue-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Plano de Assinatura
                </CardTitle>
            </CardHeader>
            <CardContent>
                {membership && plan ? (
                    <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-blue-900">{plan.name}</span>
                                <Badge className="bg-blue-500 text-[9px]">ATIVO</Badge>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>📋 {getPlanTypeLabel(plan.plan_type)}</p>
                                {plan.plan_type === 'weekly_frequency' && (
                                    <p>📅 {plan.weekly_frequency}x por semana</p>
                                )}
                                {membership.schedule_days && membership.schedule_days.length > 0 && (
                                    <p className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {membership.schedule_days.map(d =>
                                            ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]
                                        ).join(', ')}
                                    </p>
                                )}
                                {membership.schedule_time && (
                                    <p className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {membership.schedule_time}
                                    </p>
                                )}
                                {membership.professionals && (
                                    <p className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {membership.professionals.name}
                                    </p>
                                )}
                                {membership.services && (
                                    <p>🏷️ {membership.services.name}</p>
                                )}
                                <p className="text-xs text-blue-600">
                                    Desde {format(new Date(membership.start_date), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MembershipDialog
                                clientId={clientId}
                                clientName={clientName}
                                onSuccess={loadMembership}
                                trigger={
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <CreditCard className="mr-1 h-3 w-3" /> Trocar Plano
                                    </Button>
                                }
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={handleCancel}
                                disabled={cancelling}
                            >
                                {cancelling
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <XCircle className="mr-1 h-3 w-3" />
                                }
                                Cancelar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                            <CreditCard className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-600">Sem plano ativo</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Atribua um plano para gerar agendamentos recorrentes.
                            </p>
                        </div>
                        <MembershipDialog
                            clientId={clientId}
                            clientName={clientName}
                            onSuccess={loadMembership}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
