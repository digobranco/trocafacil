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
import { Plus, CalendarPlus, Repeat } from 'lucide-react'
import { createAppointment, getAppointmentFormData } from './appointment-actions'
import { getCurrentUser } from './actions'
import { format } from 'date-fns'

interface AppointmentDialogProps {
    selectedDate?: Date
    selectedTime?: string
    defaultProfessionalId?: string
    customerId?: string
    trigger?: React.ReactNode
    onSuccess?: () => void
    disabled?: boolean
}

export function AppointmentDialog({ selectedDate, selectedTime, defaultProfessionalId, customerId: initialCustomerId, trigger, onSuccess, disabled }: AppointmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [formData, setFormData] = useState<{
        customers: { id: string; full_name: string }[]
        professionals: { id: string; name: string }[]
        services: { id: string; name: string; duration_minutes: number }[]
    }>({ customers: [], professionals: [], services: [] })

    const [customerId, setCustomerId] = useState(initialCustomerId || '')
    const [professionalId, setProfessionalId] = useState(defaultProfessionalId || '')
    const [serviceId, setServiceId] = useState('')
    const [date, setDate] = useState(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState(selectedTime || '08:00')
    const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly'>('none')
    const [recurrenceWeeks, setRecurrenceWeeks] = useState(12)
    const [selectedDays, setSelectedDays] = useState<number[]>([])

    // Update selectedDays when date changes
    useEffect(() => {
        const d = new Date(date + 'T00:00:00')
        if (!isNaN(d.getTime())) {
            setSelectedDays([d.getDay()])
        }
    }, [date])

    useEffect(() => {
        if (open) {
            loadInitialData()
            // Sync professionalId with prop when dialog opens
            if (defaultProfessionalId) {
                setProfessionalId(defaultProfessionalId)
            }
            if (initialCustomerId) {
                setCustomerId(initialCustomerId)
            }
        }
    }, [open, defaultProfessionalId, initialCustomerId])

    async function loadInitialData() {
        const [userData, formFields] = await Promise.all([
            getCurrentUser(),
            getAppointmentFormData()
        ])

        setUser(userData)
        setFormData(formFields)

        if (userData?.role === 'customer') {
            setCustomerId(userData.customer_id || '')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!customerId || !professionalId || !serviceId) {
            alert('Preencha todos os campos obrigatórios.')
            return
        }

        setLoading(true)

        const res = await createAppointment({
            customerId,
            professionalId,
            serviceId,
            date,
            time,
            recurrence,
            recurrenceWeeks: recurrence !== 'none' ? recurrenceWeeks : undefined,
            selectedDays: recurrence !== 'none' ? selectedDays : undefined
        })

        setLoading(false)

        if (res.success) {
            const msg = res.count && res.count > 1
                ? `${res.count} agendamentos criados com sucesso!`
                : 'Agendamento criado com sucesso!'
            alert(msg)
            setOpen(false)
            // Reset form
            setCustomerId('')
            if (!defaultProfessionalId) {
                setProfessionalId('')
            }
            setServiceId('')
            setRecurrence('none')
            onSuccess?.()
        } else {
            alert(res.error || 'Erro ao criar agendamento.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={disabled ? () => setOpen(false) : setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button disabled={disabled}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="h-5 w-5" />
                        Novo Agendamento
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo agendamento.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {user?.role !== 'customer' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Cliente *</Label>
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formData.customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Serviço *</Label>
                        <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                            <SelectContent>
                                {formData.services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.duration_minutes} min)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Profissional *</Label>
                        <Select value={professionalId} onValueChange={setProfessionalId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o profissional" />
                            </SelectTrigger>
                            <SelectContent>
                                {formData.professionals.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Data *</Label>
                        <Input
                            type="date"
                            className="col-span-3"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Horário *</Label>
                        <Input
                            type="time"
                            className="col-span-3"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    {user?.role !== 'customer' && (
                        <div className="border-t pt-4 mt-2">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                                <Repeat className="h-4 w-4" />
                                Recorrência
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Repetir</Label>
                                <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Não repetir</SelectItem>
                                        <SelectItem value="weekly">Semanalmente</SelectItem>
                                        <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {recurrence !== 'none' && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4 mt-3">
                                        <Label className="text-right">Dias</Label>
                                        <div className="col-span-3 flex flex-wrap gap-2">
                                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, index) => {
                                                const isSelected = selectedDays.includes(index)
                                                return (
                                                    <Button
                                                        key={index}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="h-8 w-8 p-0 rounded-full"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                if (selectedDays.length > 1) {
                                                                    setSelectedDays(selectedDays.filter(d => d !== index))
                                                                }
                                                            } else {
                                                                setSelectedDays([...selectedDays, index].sort())
                                                            }
                                                        }}
                                                    >
                                                        {dayName}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4 mt-3">
                                        <Label className="text-right">Por quantas semanas?</Label>
                                        <Input
                                            type="number"
                                            className="col-span-3"
                                            value={recurrenceWeeks}
                                            onChange={(e) => setRecurrenceWeeks(parseInt(e.target.value) || 12)}
                                            min={1}
                                            max={52}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Agendar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
