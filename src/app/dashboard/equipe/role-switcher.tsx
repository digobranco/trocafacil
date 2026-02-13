'use client'

import { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '../actions'


export function RoleSwitcher({ userId, currentRole }: { userId: string, currentRole: string }) {
    const [loading, setLoading] = useState(false)

    async function handleRoleChange(newRole: string) {
        setLoading(true)
        const res = await updateUserRole(userId, newRole as any)

        if (res.error) {
            alert(res.error)
        } else {
            alert('Papel atualizado com sucesso!')
        }
        setLoading(false)
    }

    return (
        <Select defaultValue={currentRole} onValueChange={handleRoleChange} disabled={loading}>
            <SelectTrigger className="w-[180px] ml-auto">
                <SelectValue placeholder="Selecione o papel" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
        </Select>
    )
}
