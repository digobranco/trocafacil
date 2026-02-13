'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProfessional, updateProfessional } from './actions'

interface ProfessionalFormProps {
    professional?: {
        id: string
        name: string
        email: string | null
        phone: string | null
        specialty: string | null
        bio: string | null
    }
    onSuccess: () => void
}

export function ProfessionalForm({ professional, onSuccess }: ProfessionalFormProps) {
    const isEditing = !!professional
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState(professional?.phone || '')

    // Phone mask function (same as customer-form)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '') // Remove non-digits

        if (value.length > 11) value = value.slice(0, 11)

        // Mask (XX) XXXXX-XXXX or (XX) XXXX-XXXX
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2')
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1')
        }

        setPhone(value)
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        let res

        if (isEditing && professional) {
            formData.append('id', professional.id)
            res = await updateProfessional(formData)
        } else {
            res = await createProfessional(formData)
        }

        setLoading(false)

        if (res?.success) {
            onSuccess()
        } else {
            alert(res?.error || 'Erro ao salvar profissional.')
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
                    defaultValue={professional?.name || ''}
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                    Email
                </Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    className="col-span-3"
                    defaultValue={professional?.email || ''}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                    Telefone
                </Label>
                <Input
                    id="phone"
                    name="phone"
                    className="col-span-3"
                    placeholder="(99) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specialty" className="text-right">
                    Especialidade
                </Label>
                <Input
                    id="specialty"
                    name="specialty"
                    className="col-span-3"
                    defaultValue={professional?.specialty || ''}
                    placeholder="Ex: Fisioterapeuta, Personal Trainer"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bio" className="text-right">
                    Bio / Notas
                </Label>
                <Textarea
                    id="bio"
                    name="bio"
                    className="col-span-3"
                    defaultValue={professional?.bio || ''}
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
