'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getSchedules, saveSchedules, getProfessionals, Schedule } from '../actions'
import { Loader2, Save, Plus, Trash2, Users } from 'lucide-react'

const DAYS = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
]

export default function AvailabilityPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])
    const [selectedProfessional, setSelectedProfessional] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadProfessionals()
    }, [])

    useEffect(() => {
        if (selectedProfessional) {
            loadSchedules()
        }
    }, [selectedProfessional])

    async function loadProfessionals() {
        const data = await getProfessionals()
        setProfessionals(data)
        if (data.length > 0) {
            setSelectedProfessional(data[0].id)
        }
        setLoading(false)
    }

    async function loadSchedules() {
        setLoading(true)
        const data = await getSchedules(selectedProfessional)
        setSchedules(data)
        setLoading(false)
    }

    const addSlot = (dayIndex: number) => {
        // Get existing slots for this day to calculate next time
        const daySlots = getSlotsForDay(dayIndex)
        let startTime = '08:00'
        let endTime = '12:00'

        if (daySlots.length > 0) {
            // Sort by end_time to get the last slot
            const sortedSlots = [...daySlots].sort((a, b) =>
                a.end_time.localeCompare(b.end_time)
            )
            const lastSlot = sortedSlots[sortedSlots.length - 1]

            // Parse the last end time and add 1 hour for new start
            const [lastEndHour, lastEndMinute] = lastSlot.end_time.split(':').map(Number)
            const newStartHour = lastEndHour + 1

            // Only if not past 23:00
            if (newStartHour < 24) {
                startTime = `${String(newStartHour).padStart(2, '0')}:${String(lastEndMinute).padStart(2, '0')}`

                // New end time = start + 4 hours (max 23:59)
                const newEndHour = Math.min(newStartHour + 4, 23)
                endTime = `${String(newEndHour).padStart(2, '0')}:${String(lastEndMinute).padStart(2, '0')}`
            }
        }

        const newSlot: Schedule = {
            day_of_week: dayIndex,
            start_time: startTime,
            end_time: endTime,
            is_active: true,
            max_participants: 1
        }
        setSchedules([...schedules, newSlot])
    }

    const removeSlot = (index: number) => {
        const newSchedules = [...schedules]
        newSchedules.splice(index, 1)
        setSchedules(newSchedules)
    }

    const updateSlot = (index: number, field: keyof Schedule, value: any) => {
        const newSchedules = [...schedules]
        newSchedules[index] = { ...newSchedules[index], [field]: value }
        setSchedules(newSchedules)
    }

    const getSlotsForDay = (dayIndex: number) => {
        return schedules
            .filter(s => s.day_of_week === dayIndex)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
    }

    const getOriginalIndex = (slot: Schedule) => {
        return schedules.indexOf(slot)
    }

    async function handleSave() {
        if (!selectedProfessional) {
            alert('Selecione um profissional.')
            return
        }
        setSaving(true)
        const res = await saveSchedules(schedules, selectedProfessional)
        setSaving(false)
        if (res?.error) {
            alert(res.error)
        } else {
            alert('Horários salvos com sucesso!')
            loadSchedules()
        }
    }

    if (loading && professionals.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Disponibilidade</h3>
                    <p className="text-muted-foreground">
                        Defina os horários de atendimento por profissional.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving || !selectedProfessional}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </div>

            {/* Professional Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Label className="font-medium">Profissional:</Label>
                        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                            <SelectTrigger className="w-64">
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
                        {professionals.length === 0 && (
                            <span className="text-sm text-muted-foreground">
                                Cadastre profissionais primeiro.
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : selectedProfessional ? (
                <div className="grid gap-4">
                    {DAYS.map((dayName, dayIndex) => {
                        const daySlots = getSlotsForDay(dayIndex)
                        const isActive = daySlots.length > 0 && daySlots.some(s => s.is_active)

                        return (
                            <Card key={dayIndex} className={!isActive ? 'opacity-70 bg-muted/30' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-28 pt-2 font-medium flex flex-col gap-2">
                                            <span>{dayName}</span>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            if (daySlots.length === 0) addSlot(dayIndex)
                                                            else {
                                                                daySlots.forEach(s => updateSlot(getOriginalIndex(s), 'is_active', true))
                                                            }
                                                        } else {
                                                            daySlots.forEach(s => updateSlot(getOriginalIndex(s), 'is_active', false))
                                                        }
                                                    }}
                                                />
                                                <Label className="text-xs text-muted-foreground cursor-pointer">
                                                    {isActive ? 'Ativo' : 'Folga'}
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {daySlots.map((slot, i) => {
                                                const originalIndex = getOriginalIndex(slot)
                                                return (
                                                    <div key={i} className="flex items-center gap-2 flex-wrap">
                                                        <Input
                                                            type="time"
                                                            className="w-24"
                                                            value={slot.start_time}
                                                            onChange={(e) => updateSlot(originalIndex, 'start_time', e.target.value)}
                                                            disabled={!slot.is_active}
                                                        />
                                                        <span className="text-muted-foreground">-</span>
                                                        <Input
                                                            type="time"
                                                            className="w-24"
                                                            value={slot.end_time}
                                                            onChange={(e) => updateSlot(originalIndex, 'end_time', e.target.value)}
                                                            disabled={!slot.is_active}
                                                        />
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                className="w-16"
                                                                min={1}
                                                                max={50}
                                                                value={slot.max_participants || 1}
                                                                onChange={(e) => updateSlot(originalIndex, 'max_participants', parseInt(e.target.value) || 1)}
                                                                disabled={!slot.is_active}
                                                                title="Máximo de participantes"
                                                            />
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeSlot(originalIndex)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                )
                                            })}

                                            {isActive && (
                                                <Button variant="outline" size="sm" onClick={() => addSlot(dayIndex)} className="mt-2 text-xs">
                                                    <Plus className="mr-2 h-3 w-3" />
                                                    Adicionar Horário
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="p-8 text-center border rounded-md bg-slate-50 text-muted-foreground">
                    Selecione um profissional para configurar a disponibilidade.
                </div>
            )}
        </div>
    )
}
