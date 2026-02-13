'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateTenantByAdmin } from '../actions'
import { toast } from 'sonner'

interface TenantProfileFormProps {
    tenant: {
        id: string
        name: string
        slug: string
        invite_code: string
        admin_invite_code: string
        plan: string
        is_active: boolean
    }
}

export function TenantProfileForm({ tenant }: TenantProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [plan, setPlan] = useState(tenant.plan || 'free')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        // Add plan to formData since Select doesn't use name attribute for native form submission
        formData.append('plan', plan)

        const res = await updateTenantByAdmin(tenant.id, formData)
        setLoading(false)

        if (res.success) {
            toast.success('Empresa atualizada com sucesso!')
        } else {
            toast.error(res.error || 'Erro ao atualizar empresa')
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-xl">
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border">
                <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    defaultChecked={tenant.is_active}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                    Tenant Ativo (Status Operacional)
                </Label>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={tenant.name}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">trocafacil.com/</span>
                        <Input
                            id="slug"
                            name="slug"
                            defaultValue={tenant.slug}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="invite_code">Código de Convite (Aluno)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="invite_code"
                                name="invite_code"
                                defaultValue={tenant.invite_code}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const link = `${window.location.origin}/register?code=${tenant.invite_code}`
                                    navigator.clipboard.writeText(link)
                                    toast.success('Link de Aluno copiado!')
                                }}
                            >
                                Link
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="admin_invite_code">Código de Convite (Admin)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="admin_invite_code"
                                name="admin_invite_code"
                                defaultValue={tenant.admin_invite_code}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-indigo-50 text-indigo-700 border-indigo-200"
                                onClick={() => {
                                    const link = `${window.location.origin}/register?code=${tenant.admin_invite_code}`
                                    navigator.clipboard.writeText(link)
                                    toast.success('Link de Administrador copiado!')
                                }}
                            >
                                Link
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="plan">Plano de Assinatura</Label>
                    <Select value={plan} onValueChange={setPlan}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="pro">Profissional (Pro)</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="pt-4 border-t">
                <Button type="submit" disabled={loading} className="w-full md:w-auto px-8">
                    {loading ? 'Sincronizando...' : 'Confirmar Alterações'}
                </Button>
            </div>
        </form>
    )
}
