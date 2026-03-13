'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, XCircle, Loader2, CalendarDays, Clock, User, Plus } from 'lucide-react'
import { getActiveClientMemberships, cancelClientMembership, type ClientMembership } from '../planos/actions'
import { getPlanTypeLabel } from '../planos/utils'
import { MembershipDialog } from './membership-dialog'
import { format } from 'date-fns'

interface ClientMembershipCardProps {
    clientId: string
    clientName: string
}

export function ClientMembershipCard({ clientId, clientName }: ClientMembershipCardProps) {
    const [memberships, setMemberships] = useState<ClientMembership[]>([])
    const [loading, setLoading] = useState(true)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    useEffect(() => {
        loadMemberships()
    }, [clientId])

    async function loadMemberships() {
        setLoading(true)
        const data = await getActiveClientMemberships(clientId)
        setMemberships(data)
        setLoading(false)
    }

    async function handleCancel(membershipId: string) {
        if (!confirm('Cancelar o plano deste cliente? Os agendamentos futuros do plano serão mantidos.')) return

        setCancellingId(membershipId)
        const res = await cancelClientMembership(membershipId)
        setCancellingId(null)

        if (res.error) {
            alert(res.error)
        } else {
            alert('Plano cancelado com sucesso.')
            loadMemberships()
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

    return (
        <Card className="border-blue-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Planos de Assinatura
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {memberships.length > 0 ? (
                        memberships.map((membership) => {
                            const plan = membership.membership_plans
                            if (!plan) return null

                            return (
                                <div key={membership.id} className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-3">
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
                                    <div className="pt-2 border-t border-blue-200">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                            onClick={() => handleCancel(membership.id)}
                                            disabled={!!cancellingId}
                                        >
                                            {cancellingId === membership.id
                                                ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                : <XCircle className="h-3 w-3 mr-1" />
                                            }
                                            Cancelar este plano
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
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
                        </div>
                    )}

                    <div className="pt-2">
                        <MembershipDialog
                            clientId={clientId}
                            clientName={clientName}
                            onSuccess={loadMemberships}
                            trigger={
                                <Button variant="outline" size="sm" className="w-full gap-2">
                                    <Plus className="h-4 w-4" /> 
                                    {memberships.length > 0 ? 'Adicionar Outro Plano' : 'Atribuir Plano'}
                                </Button>
                            }
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
