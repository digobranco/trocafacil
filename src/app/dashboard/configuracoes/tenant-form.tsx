'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenant } from '../actions'

import { updateTenantSettings } from '../actions'

interface TenantFormProps {
    defaultName?: string
    defaultSlug?: string
    defaultCancellationWindow?: number
    defaultCreditValidity?: number
    inviteCode?: string
    isActive?: boolean
}

export function TenantForm({ defaultName, defaultSlug, defaultCancellationWindow, defaultCreditValidity, inviteCode, isActive }: TenantFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    const isEditing = !!defaultSlug

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        setSuccess(null)

        let res: { error?: string, success?: boolean, message?: string } | undefined

        if (isEditing) {
            res = await updateTenantSettings(formData)
        } else {
            // createTenant redirects on success, so we only handle error here
            const result = await createTenant(formData)
            if (result?.error) res = { error: result.error }
        }

        if (res?.error) {
            setError(res.error)
        } else if (res?.success) {
            setSuccess(res.message || 'Salvo com sucesso!')
        }

        setLoading(false)
    }

    return (
        <form action={handleSubmit} className="space-y-4 max-w-md">
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                    {success}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Studio Pilates Zen"
                    defaultValue={defaultName || ''}
                    required
                />
            </div>

            {!isEditing && (
                <div className="space-y-2">
                    <Label htmlFor="slug">Link Personalizado (Slug)</Label>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">trocafacil.com/</span>
                        <Input
                            id="slug"
                            name="slug"
                            placeholder="studio-zen"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Este será o endereço único da sua página de agendamentos.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cancellation_window_hours">Janela de Cancelamento (horas)</Label>
                    <Input
                        id="cancellation_window_hours"
                        name="cancellation_window_hours"
                        type="number"
                        min="0"
                        defaultValue={defaultCancellationWindow ?? 24}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Tempo mínimo para cancelar e gerar crédito.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="credit_validity_days">Validade do Crédito (dias)</Label>
                    <Input
                        id="credit_validity_days"
                        name="credit_validity_days"
                        type="number"
                        min="1"
                        defaultValue={defaultCreditValidity ?? 30}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Prazo para usar a reposição.
                    </p>
                </div>
            </div>

            {isEditing && inviteCode && (
                <div className="space-y-2 p-4 bg-muted rounded-md border">
                    <Label className="text-sm font-semibold">Vincular novos membros</Label>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Código de Convite:</p>
                            <div className="flex items-center space-x-2">
                                <code className="bg-background px-2 py-1 rounded border font-mono text-lg flex-1">
                                    {inviteCode}
                                </code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteCode)
                                        alert('Código copiado!')
                                    }}
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Link de Cadastro Direto:</p>
                            <div className="flex items-center space-x-2">
                                <Input
                                    readOnly
                                    value={`${origin}/register?code=${inviteCode}`}
                                    className="bg-background text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${origin}/register?code=${inviteCode}`)
                                        alert('Link copiado!')
                                    }}
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
    )
}
