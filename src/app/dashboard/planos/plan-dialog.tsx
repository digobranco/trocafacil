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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil } from 'lucide-react'
import { createPlan, updatePlan, type MembershipPlan, type CreatePlanData, type PlanType } from './actions'

interface PlanDialogProps {
    plan?: MembershipPlan
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function PlanDialog({ plan, onSuccess, trigger }: PlanDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const isEditing = !!plan

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [planType, setPlanType] = useState<PlanType>('weekly_frequency')
    const [monthlyPrice, setMonthlyPrice] = useState('')
    const [packagePrice, setPackagePrice] = useState('')
    const [weeklyFrequency, setWeeklyFrequency] = useState('2')
    const [creditsPerMonth, setCreditsPerMonth] = useState('')
    const [totalCredits, setTotalCredits] = useState('')
    const [creditValidityDays, setCreditValidityDays] = useState('30')

    useEffect(() => {
        if (open && plan) {
            setName(plan.name)
            setDescription(plan.description || '')
            setPlanType(plan.plan_type)
            setMonthlyPrice(plan.monthly_price?.toString() || '')
            setPackagePrice(plan.package_price?.toString() || '')
            setWeeklyFrequency(plan.weekly_frequency?.toString() || '2')
            setCreditsPerMonth(plan.credits_per_month?.toString() || '')
            setTotalCredits(plan.total_credits?.toString() || '')
            setCreditValidityDays(plan.credit_validity_days?.toString() || '30')
        } else if (open && !plan) {
            setName('')
            setDescription('')
            setPlanType('weekly_frequency')
            setMonthlyPrice('')
            setPackagePrice('')
            setWeeklyFrequency('2')
            setCreditsPerMonth('')
            setTotalCredits('')
            setCreditValidityDays('30')
        }
    }, [open, plan])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!name.trim()) {
            alert('Informe o nome do plano.')
            return
        }

        setLoading(true)

        const data: CreatePlanData = {
            name: name.trim(),
            description: description.trim() || undefined,
            plan_type: planType,
            monthly_price: monthlyPrice ? parseFloat(monthlyPrice) : null,
            package_price: packagePrice ? parseFloat(packagePrice) : null,
            weekly_frequency: weeklyFrequency ? parseInt(weeklyFrequency) : null,
            credits_per_month: creditsPerMonth ? parseInt(creditsPerMonth) : null,
            total_credits: totalCredits ? parseInt(totalCredits) : null,
            credit_validity_days: parseInt(creditValidityDays) || 30,
        }

        const res = isEditing
            ? await updatePlan(plan.id, data)
            : await createPlan(data)

        setLoading(false)

        if (res.success) {
            alert(isEditing ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!')
            setOpen(false)
            onSuccess?.()
        } else {
            alert(res.error || 'Erro ao salvar plano.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Plano
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {isEditing ? 'Editar Plano' : 'Novo Plano'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Edite os dados do plano.' : 'Configure um novo plano de assinatura.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Nome *</Label>
                        <Input
                            className="col-span-3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Pilates 2x/semana"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Descrição</Label>
                        <Textarea
                            className="col-span-3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição opcional do plano"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tipo *</Label>
                        <Select value={planType} onValueChange={(v: PlanType) => setPlanType(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly_frequency">Frequência Semanal</SelectItem>
                                <SelectItem value="monthly_credits">Créditos Mensais</SelectItem>
                                <SelectItem value="package">Pacote Avulso</SelectItem>
                                <SelectItem value="unlimited">Ilimitado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic fields based on plan type */}
                    {planType === 'weekly_frequency' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Frequência *</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        className="w-20"
                                        value={weeklyFrequency}
                                        onChange={(e) => setWeeklyFrequency(e.target.value)}
                                        min={1}
                                        max={7}
                                        required
                                    />
                                    <span className="text-sm text-muted-foreground">vezes por semana</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Preço mensal</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        className="w-32"
                                        value={monthlyPrice}
                                        onChange={(e) => setMonthlyPrice(e.target.value)}
                                        step="0.01"
                                        min={0}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {planType === 'monthly_credits' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Créditos/mês *</Label>
                                <Input
                                    type="number"
                                    className="col-span-3 w-32"
                                    value={creditsPerMonth}
                                    onChange={(e) => setCreditsPerMonth(e.target.value)}
                                    min={1}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Preço mensal</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        className="w-32"
                                        value={monthlyPrice}
                                        onChange={(e) => setMonthlyPrice(e.target.value)}
                                        step="0.01"
                                        min={0}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {planType === 'package' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Total de aulas *</Label>
                                <Input
                                    type="number"
                                    className="col-span-3 w-32"
                                    value={totalCredits}
                                    onChange={(e) => setTotalCredits(e.target.value)}
                                    min={1}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Preço pacote</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        className="w-32"
                                        value={packagePrice}
                                        onChange={(e) => setPackagePrice(e.target.value)}
                                        step="0.01"
                                        min={0}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {planType === 'unlimited' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Preço mensal</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">R$</span>
                                <Input
                                    type="number"
                                    className="w-32"
                                    value={monthlyPrice}
                                    onChange={(e) => setMonthlyPrice(e.target.value)}
                                    step="0.01"
                                    min={0}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Validade</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                type="number"
                                className="w-20"
                                value={creditValidityDays}
                                onChange={(e) => setCreditValidityDays(e.target.value)}
                                min={1}
                                max={365}
                            />
                            <span className="text-sm text-muted-foreground">dias</span>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar Plano')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
