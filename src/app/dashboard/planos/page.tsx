'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    CreditCard,
    Loader2,
    Pencil,
    Calendar,
    CalendarDays,
    Infinity,
    Package,
} from 'lucide-react'
import { getPlans, togglePlan, generateMonthlyAppointments, type MembershipPlan } from './actions'
import { getPlanTypeLabel } from './utils'
import { PlanDialog } from './plan-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ViewToggle, useViewToggle } from '@/components/ui/view-toggle'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

function getPlanIcon(type: string) {
    switch (type) {
        case 'weekly_frequency': return Calendar
        case 'monthly_credits': return CreditCard
        case 'package': return Package
        case 'unlimited': return Infinity
        default: return CreditCard
    }
}

function getPlanBadgeColor(type: string) {
    switch (type) {
        case 'weekly_frequency': return 'bg-blue-100 text-blue-800'
        case 'monthly_credits': return 'bg-green-100 text-green-800'
        case 'package': return 'bg-purple-100 text-purple-800'
        case 'unlimited': return 'bg-amber-100 text-amber-800'
        default: return ''
    }
}

function formatPrice(price: number | null) {
    if (!price) return '—'
    return `R$ ${price.toFixed(2)}`
}

function getPlanDetails(plan: MembershipPlan): string {
    switch (plan.plan_type) {
        case 'weekly_frequency':
            return `${plan.weekly_frequency}x por semana`
        case 'monthly_credits':
            return `${plan.credits_per_month} créditos/mês`
        case 'package':
            return `${plan.total_credits} aulas no pacote`
        case 'unlimited':
            return 'Acesso ilimitado'
        default:
            return ''
    }
}

export default function PlansPage() {
    const [plans, setPlans] = useState<MembershipPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const { view, toggle } = useViewToggle('planos-view')


    useEffect(() => {
        loadPlans()
    }, [])

    async function loadPlans() {
        setLoading(true)
        const data = await getPlans()
        setPlans(data)
        setLoading(false)
    }

    async function handleToggle(id: string, isActive: boolean) {
        const res = await togglePlan(id, !isActive)
        if (res.error) {
            alert(res.error)
        } else {
            loadPlans()
        }
    }

    async function handleGenerateMonthly() {
        if (!confirm('Gerar agendamentos recorrentes para todas as assinaturas ativas?')) return
        setGenerating(true)
        const res = await generateMonthlyAppointments()
        setGenerating(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert(`${res.count} agendamento(s) criado(s) com sucesso.`)
        }
    }



    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Planos</h3>
                    <p className="text-muted-foreground">
                        Gerencie os planos de assinatura disponíveis.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ViewToggle view={view} onToggle={toggle} />
                    <Button
                        variant="outline"
                        onClick={handleGenerateMonthly}
                        disabled={generating}
                    >
                        {generating
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <CalendarDays className="mr-2 h-4 w-4" />
                        }
                        Gerar Agendamentos do Mês
                    </Button>
                    <PlanDialog onSuccess={loadPlans} />
                </div>
            </div>

            {plans.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="Nenhum plano cadastrado"
                    description="Crie seus modelos de planos (mensalidade, pacote de aulas, etc) para vincular aos seus clientes."
                    className="mt-4"
                >
                    <PlanDialog
                        onSuccess={loadPlans}
                        trigger={
                            <Button size="lg" className="px-8 shadow-md">
                                Criar Meu Primeiro Plano
                            </Button>
                        }
                    />
                </EmptyState>
            ) : (
                <>
                    {/* List View — desktop only */}
                    {view === 'list' ? (
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Detalhes</TableHead>
                                        <TableHead>Preço</TableHead>
                                        <TableHead>Val. Créditos</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plans.map((plan) => {
                                        const Icon = getPlanIcon(plan.plan_type)
                                        return (
                                            <TableRow key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">{plan.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPlanBadgeColor(plan.plan_type)} variant="secondary">
                                                        {getPlanTypeLabel(plan.plan_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{getPlanDetails(plan)}</TableCell>
                                                <TableCell className="text-sm">
                                                    {plan.plan_type === 'package' ? formatPrice(plan.package_price) : formatPrice(plan.monthly_price)}
                                                    {plan.plan_type !== 'package' && plan.monthly_price ? '/mês' : ''}
                                                </TableCell>
                                                <TableCell className="text-sm">{plan.credit_validity_days} dias</TableCell>
                                                <TableCell>
                                                    <Badge variant={plan.is_active ? 'default' : 'secondary'}
                                                        className={plan.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                                        {plan.is_active ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <PlanDialog plan={plan} onSuccess={loadPlans} trigger={
                                                            <Button variant="outline" size="sm"><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                                                        } />
                                                        <Button variant="outline" size="sm" onClick={() => handleToggle(plan.id, plan.is_active)}>
                                                            {plan.is_active ? 'Desativar' : 'Ativar'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}

                    {/* Card View — always on mobile, toggle on desktop */}
                    <div className={view === 'list' ? 'md:hidden' : ''}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => {
                                const Icon = getPlanIcon(plan.plan_type)
                                return (
                                    <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                                </div>
                                                <Badge className={getPlanBadgeColor(plan.plan_type)} variant="secondary">
                                                    {getPlanTypeLabel(plan.plan_type)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {plan.description && (
                                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                            )}
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Detalhes:</span>
                                                    <span className="font-medium">{getPlanDetails(plan)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Preço:</span>
                                                    <span className="font-medium">
                                                        {plan.plan_type === 'package' ? formatPrice(plan.package_price) : formatPrice(plan.monthly_price)}
                                                        {plan.plan_type !== 'package' && plan.monthly_price ? '/mês' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Validade créditos:</span>
                                                    <span className="font-medium">{plan.credit_validity_days} dias</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <PlanDialog plan={plan} onSuccess={loadPlans} trigger={
                                                    <Button variant="outline" size="sm"><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                                                } />
                                                <Button variant="outline" size="sm" onClick={() => handleToggle(plan.id, plan.is_active)}>
                                                    {plan.is_active ? 'Desativar' : 'Ativar'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
