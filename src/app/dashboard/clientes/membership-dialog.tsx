'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { getActivePlans, createClientMembership, getPlanTypeLabel, type MembershipPlan } from '../planos/actions'

interface MembershipDialogProps {
    clientId: string
    clientName: string
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function MembershipDialog({ clientId, clientName, onSuccess, trigger }: MembershipDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [plans, setPlans] = useState<MembershipPlan[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    useEffect(() => {
        if (open) {
            loadPlans()
        }
    }, [open])

    async function loadPlans() {
        const data = await getActivePlans()
        setPlans(data)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedPlanId) {
            alert('Selecione um plano.')
            return
        }

        setLoading(true)
        const res = await createClientMembership({
            clientId,
            planId: selectedPlanId,
            startDate,
        })
        setLoading(false)

        if (res.success) {
            alert('Plano atribuído com sucesso! Os créditos foram calculados.')
            setOpen(false)
            onSuccess?.()
        } else {
            alert(res.error || 'Erro ao atribuir plano.')
        }
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" size="sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Atribuir Plano
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Atribuir Plano
                    </DialogTitle>
                    <DialogDescription>
                        Atribuir um plano de assinatura para <strong>{clientName}</strong>.
                        {'\n'}Se já houver um plano ativo, ele será substituído.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Plano *</Label>
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({getPlanTypeLabel(plan.plan_type)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedPlan && (
                        <div className="ml-[calc(25%+1rem)] text-sm text-muted-foreground space-y-1">
                            {selectedPlan.plan_type === 'weekly_frequency' && (
                                <p>📅 {selectedPlan.weekly_frequency}x por semana</p>
                            )}
                            {selectedPlan.plan_type === 'monthly_credits' && (
                                <p>🎫 {selectedPlan.credits_per_month} créditos/mês</p>
                            )}
                            {selectedPlan.plan_type === 'package' && (
                                <p>📦 {selectedPlan.total_credits} aulas no pacote</p>
                            )}
                            {selectedPlan.plan_type === 'unlimited' && (
                                <p>♾️ Acesso ilimitado</p>
                            )}
                            {(selectedPlan.monthly_price || selectedPlan.package_price) && (
                                <p>💰 R$ {(selectedPlan.plan_type === 'package' ? selectedPlan.package_price : selectedPlan.monthly_price)?.toFixed(2)}</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Início *</Label>
                        <Input
                            type="date"
                            className="col-span-3"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || !selectedPlanId}>
                            {loading ? 'Salvando...' : 'Atribuir Plano'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
