'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createCustomer, updateCustomer } from './actions'

interface CustomerFormProps {
    customer?: {
        id: string
        full_name: string | null
        phone: string | null
        email: string | null
        notes: string | null
        active?: boolean
    }
    onSuccess: () => void
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
    const isEditing = !!customer
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState(customer?.phone || '')
    const [active, setActive] = useState(customer?.active ?? true)

    // Phone mask function
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

        // Add active status to formData
        formData.append('active', String(active))

        let res
        if (isEditing && customer) {
            formData.append('id', customer.id)
            res = await updateCustomer(formData)
        } else {
            res = await createCustomer(formData)
        }

        setLoading(false)

        if (res?.success) {
            onSuccess()
        } else {
            alert(res?.error || 'Erro ao salvar cliente.')
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
                    defaultValue={customer?.full_name || ''}
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                    Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="phone"
                    name="phone"
                    className="col-span-3"
                    placeholder="(99) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
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
                    defaultValue={customer?.email || ''}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                    Obs.
                </Label>
                <Textarea
                    id="notes"
                    name="notes"
                    className="col-span-3"
                    placeholder="Escreva aqui observações..."
                    defaultValue={customer?.notes || ''}
                />
            </div>
            {isEditing && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                        Status
                    </Label>
                    <div className="flex items-center gap-2 col-span-3">
                        <Switch
                            id="status"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                        <span className="text-sm text-muted-foreground">
                            {active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
            )}
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}
                </Button>
            </div>
        </form>
    )
}
