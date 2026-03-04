'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { regenerateProfessionalInviteCode } from '@/app/dashboard/actions'

interface InviteCodeCardProps {
    initialCode: string
    tenantSlug: string
}

export function InviteCodeCard({ initialCode, tenantSlug }: InviteCodeCardProps) {
    const [code, setCode] = useState(initialCode)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    // Construct the invitation link
    // In production this should use the actual domain
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const inviteLink = `${baseUrl}/register?code=${code}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            toast.success('Link de convite copiado!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Erro ao copiar link')
        }
    }

    const handleRegenerate = async () => {
        if (!confirm('Ao gerar um novo código, o anterior deixará de funcionar. Deseja continuar?')) {
            return
        }

        setIsRegenerating(true)
        try {
            const result = await regenerateProfessionalInviteCode()
            if (result.success && result.code) {
                setCode(result.code)
                toast.success('Novo código gerado com sucesso!')
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao regenerar código')
        } finally {
            setIsRegenerating(false)
        }
    }

    const handleWhatsApp = () => {
        const text = encodeURIComponent(`Olá! Você foi convidado para fazer parte da equipe no sistema TrocaFácil. Use este link para se cadastrar: ${inviteLink}`)
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-primary flex items-center gap-2">
                            <Send className="h-5 w-5" /> Convide sua Equipe
                        </CardTitle>
                        <CardDescription>
                            Envie este link para os profissionais da sua empresa.
                            Ao se cadastrarem, eles serão vinculados automaticamente.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Input
                            readOnly
                            value={inviteLink}
                            className="pr-10 bg-white"
                        />
                        <button
                            onClick={handleCopy}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            title="Copiar link"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                            )}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="bg-white"
                            onClick={handleWhatsApp}
                        >
                            WhatsApp
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            title="Gerar novo código"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
