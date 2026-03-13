'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserProfile } from '../actions'
import { validateCPF, formatCPF } from '@/utils/validation'
import { toast } from 'sonner'

interface ProfileFormProps {
    user: {
        id: string
        full_name: string | null
        phone: string | null
        cpf: string | null
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState(user.phone || '')
    const [cpf, setCpf] = useState(user.cpf ? formatCPF(user.cpf) : '')

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 11) value = value.slice(0, 11)
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

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpf(formatCPF(e.target.value))
    }

    async function handleSubmit(formData: FormData) {
        const cpfValue = formData.get('cpf') as string
        if (cpfValue && !validateCPF(cpfValue)) {
            toast.error('CPF inválido.')
            return
        }

        setLoading(true)
        const res = await updateUserProfile(formData)
        setLoading(false)

        if (res?.success) {
            toast.success('Perfil atualizado com sucesso!')
        } else {
            toast.error(res?.error || 'Erro ao atualizar perfil.')
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="full_name">Seu Nome</Label>
                <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={user.full_name || ''}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone_profile">Telefone</Label>
                    <Input
                        id="phone_profile"
                        name="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cpf_profile">CPF (Opcional)</Label>
                    <Input
                        id="cpf_profile"
                        name="cpf"
                        value={cpf}
                        onChange={handleCPFChange}
                        placeholder="000.000.000-00"
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
        </form>
    )
}
