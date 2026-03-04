'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenant } from '../actions'
import { updateTenantSettings, uploadTenantLogo } from '../actions'
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface TenantFormProps {
    defaultName?: string
    defaultSlug?: string
    defaultCancellationWindow?: number
    defaultCreditValidity?: number
    inviteCode?: string
    isActive?: boolean
    defaultLogoUrl?: string | null
}

export function TenantForm({ defaultName, defaultSlug, defaultCancellationWindow, defaultCreditValidity, inviteCode, isActive, defaultLogoUrl }: TenantFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [origin, setOrigin] = useState('')
    const [logoPreview, setLogoPreview] = useState<string | null>(defaultLogoUrl || null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Show preview immediately
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result as string)
        reader.readAsDataURL(file)

        setUploadingLogo(true)
        const formData = new FormData()
        formData.append('logo', file)

        const res = await uploadTenantLogo(formData)

        if (res.error) {
            toast.error(res.error)
            setLogoPreview(defaultLogoUrl || null) // Revert preview
        } else {
            toast.success('Logo atualizado com sucesso!')
            if (res.logoUrl) setLogoPreview(res.logoUrl)
        }
        setUploadingLogo(false)
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-md">
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

            {/* Logo Upload Section */}
            {isEditing && (
                <div className="space-y-3">
                    <Label>Logo da Empresa</Label>
                    <div className="flex items-center gap-4">
                        <div
                            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                            )}
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingLogo}
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {logoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                PNG, JPG, WebP ou SVG. Máx 2MB.
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                    />
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

            <div className="space-y-2">
                <Label htmlFor="slug">Link Personalizado (Slug)</Label>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">trocafacil.com/</span>
                    <Input
                        id="slug"
                        name="slug"
                        placeholder="studio-zen"
                        defaultValue={defaultSlug || ''}
                        required
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Este será o endereço único da sua página de agendamentos.
                </p>
            </div>

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
