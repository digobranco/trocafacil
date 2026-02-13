'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createService, updateService } from './actions'

interface ServiceFormProps {
    service?: {
        id: string
        name: string
        duration_minutes: number
        price: number | null
        description: string | null
    }
    onSuccess: () => void
}

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
    const isEditing = !!service
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        let res

        if (isEditing && service) {
            formData.append('id', service.id)
            res = await updateService(formData)
        } else {
            res = await createService(formData)
        }

        setLoading(false)

        if (res?.success) {
            onSuccess()
        } else {
            alert(res?.error || 'Erro ao salvar serviço.')
        }
    }

    return (
        <form action={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                    Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    defaultValue={service?.name || ''}
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                    Duração (min) <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="duration"
                    name="duration"
                    type="number"
                    className="col-span-3"
                    defaultValue={service?.duration_minutes || 60}
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                    Preço (R$)
                </Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    defaultValue={service?.price || ''}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                    Descrição
                </Label>
                <Textarea
                    id="description"
                    name="description"
                    className="col-span-3"
                    defaultValue={service?.description || ''}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
                </Button>
            </div>
        </form>
    )
}
