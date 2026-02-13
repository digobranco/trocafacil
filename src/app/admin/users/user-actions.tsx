'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignUserToTenant } from '../actions'
import { Loader2 } from 'lucide-react'

interface UserActionsProps {
    user: any
    tenants: any[]
}

export function UserActions({ user, tenants }: UserActionsProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedTenant, setSelectedTenant] = useState(user.tenant_id || '')
    const [selectedRole, setSelectedRole] = useState(user.role || 'customer')

    async function handleSave() {
        setLoading(true)
        await assignUserToTenant(user.id, selectedTenant, selectedRole)
        setLoading(false)
        setOpen(false)
    }

    if (user.role === 'super_admin') return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Gerenciar</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerenciar Usuário</DialogTitle>
                    <DialogDescription>
                        Alterar permissões e vínculo de empresa para {user.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Empresa</Label>
                        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Papel (Role)</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um papel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Cliente (Aluno)</SelectItem>
                                <SelectItem value="professional">Profissional</SelectItem>
                                <SelectItem value="admin">Administrador da Empresa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
