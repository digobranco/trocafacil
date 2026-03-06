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
import { Checkbox } from '@/components/ui/checkbox'
import { CreditCard, CalendarDays, Clock, User, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import {
    getMembershipFormData,
    getProfessionalServicesForMembership,
    createClientMembership,
    type MembershipPlan,
} from '../planos/actions'
import { getPlanTypeLabel } from '../planos/utils'

interface MembershipDialogProps {
    clientId: string
    clientName: string
    onSuccess?: () => void
    trigger?: React.ReactNode
}

const DAY_NAMES = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
]

export function MembershipDialog({ clientId, clientName, onSuccess, trigger }: MembershipDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form data
    const [plans, setPlans] = useState<MembershipPlan[]>([])
    const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])
    const [services, setServices] = useState<{ id: string; name: string }[]>([])

    // Selections
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    const [scheduleTime, setScheduleTime] = useState('09:00')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [weeks, setWeeks] = useState(4)

    useEffect(() => {
        if (open) {
            loadFormData()
        }
    }, [open])

    async function loadFormData() {
        const data = await getMembershipFormData()
        setPlans(data.plans)
        setProfessionals(data.professionals)
    }

    async function handleProfessionalChange(professionalId: string) {
        setSelectedProfessionalId(professionalId)
        setSelectedServiceId('')
        setServices([])

        if (professionalId) {
            const svcList = await getProfessionalServicesForMembership(professionalId)
            setServices(svcList)
        }
    }

    function handleDayToggle(dayValue: number, checked: boolean) {
        const selectedPlan = plans.find(p => p.id === selectedPlanId)
        const maxDays = selectedPlan?.weekly_frequency || 7

        if (checked) {
            if (selectedDays.length < maxDays) {
                setSelectedDays(prev => [...prev, dayValue].sort())
            }
        } else {
            setSelectedDays(prev => prev.filter(d => d !== dayValue))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedPlanId) {
            alert('Selecione um plano.')
            return
        }

        const selectedPlan = plans.find(p => p.id === selectedPlanId)
        const isWeekly = selectedPlan?.plan_type === 'weekly_frequency'

        if (isWeekly) {
            if (!selectedProfessionalId || !selectedServiceId) {
                alert('Preencha todos os campos obrigatórios de agendamento.')
                return
            }

            if (selectedDays.length === 0) {
                alert('Selecione pelo menos um dia da semana.')
                return
            }

            if (selectedPlan?.weekly_frequency && selectedDays.length !== selectedPlan.weekly_frequency) {
                alert(`O plano exige exatamente ${selectedPlan.weekly_frequency} dia(s) por semana.`)
                return
            }
        }

        setLoading(true)
        const res = await createClientMembership({
            clientId,
            planId: selectedPlanId,
            startDate,
            professionalId: selectedProfessionalId,
            serviceId: selectedServiceId,
            scheduleDays: selectedDays,
            scheduleTime,
            weeks,
        })
        setLoading(false)

        if (res.success) {
            alert(`Plano atribuído com sucesso! ${res.count > 0 ? `${res.count} agendamento(s) criado(s).` : ''}`)
            setOpen(false)
            // Reset form
            setSelectedPlanId('')
            setSelectedProfessionalId('')
            setSelectedServiceId('')
            setSelectedDays([])
            setScheduleTime('09:00')
            setWeeks(4)
            // Refresh
            window.dispatchEvent(new CustomEvent('appointment-updated'))
            onSuccess?.()
        } else {
            alert(res.error || 'Erro ao atribuir plano.')
        }
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    const isWeekly = selectedPlan?.plan_type === 'weekly_frequency'

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" size="sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Atribuir Plano
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Atribuir Plano
                    </DialogTitle>
                    <DialogDescription>
                        {isWeekly
                            ? `Atribuir um plano com agendamento recorrente para ${clientName}.`
                            : `Atribuir um plano de créditos para ${clientName}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-5 py-4">
                    {/* Plan Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-sm">Plano *</Label>
                        <Select value={selectedPlanId} onValueChange={(v) => { setSelectedPlanId(v); setSelectedDays([]) }}>
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
                                <p>🪙 {selectedPlan.credits_per_month} créditos por mês</p>
                            )}
                            {selectedPlan.plan_type === 'package' && (
                                <p>📦 {selectedPlan.total_credits} créditos totais</p>
                            )}
                            {(selectedPlan.monthly_price || selectedPlan.package_price) && (
                                <p>💰 R$ {(selectedPlan.plan_type === 'package' ? selectedPlan.package_price : selectedPlan.monthly_price)?.toFixed(2)}</p>
                            )}
                        </div>
                    )}

                    {/* Start Date */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-sm">Início *</Label>
                        <Input
                            type="date"
                            className="col-span-3"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Weekly Frequency Fields */}
                    {isWeekly && (
                        <>
                            <div className="border-t pt-4 mt-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4 ml-[25%]">
                                    Configuração de Agendamento
                                </Label>

                                {/* Professional Selection */}
                                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                    <Label className="text-right text-sm flex items-center justify-end gap-1">
                                        <User className="h-3 w-3" /> Prof. *
                                    </Label>
                                    <Select value={selectedProfessionalId} onValueChange={handleProfessionalChange}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione o profissional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {professionals.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Service Selection */}
                                {selectedProfessionalId && (
                                    <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                        <Label className="text-right text-sm flex items-center justify-end gap-1">
                                            <Briefcase className="h-3 w-3" /> Serviço *
                                        </Label>
                                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Selecione o serviço" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Days of Week */}
                                <div className="grid grid-cols-4 items-start gap-4 mb-4">
                                    <Label className="text-right text-sm pt-2">Dias *</Label>
                                    <div className="col-span-3">
                                        <div className="flex flex-wrap gap-3">
                                            {DAY_NAMES.map((day) => (
                                                <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                                                    <Checkbox
                                                        checked={selectedDays.includes(day.value)}
                                                        onCheckedChange={(checked: any) => handleDayToggle(day.value, !!checked)}
                                                    />
                                                    <span className="text-sm">{day.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {selectedPlan?.weekly_frequency && (
                                            <p className="text-xs text-muted-foreground mt-1.5">
                                                Selecione {selectedPlan.weekly_frequency} dia(s) — {selectedDays.length}/{selectedPlan.weekly_frequency} selecionado(s)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                    <Label className="text-right text-sm flex items-center justify-end gap-1">
                                        <Clock className="h-3 w-3" /> Horário *
                                    </Label>
                                    <Input
                                        type="time"
                                        className="col-span-3"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Duration in Months */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Duração *</Label>
                                    <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4">1 mês (Mês atual completo)</SelectItem>
                                            <SelectItem value="8">2 meses</SelectItem>
                                            <SelectItem value="12">3 meses</SelectItem>
                                            <SelectItem value="24">6 meses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={loading || !selectedPlanId || (isWeekly && (!selectedProfessionalId || !selectedServiceId || selectedDays.length === 0))}
                        >
                            {loading ? 'Processando...' : 'Atribuir Plano'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
