'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, MessageCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { getTenantInviteCode } from './actions'

interface InviteButtonProps {
    customerName: string
    customerEmail: string | null
}

export function InviteButton({ customerName, customerEmail }: InviteButtonProps) {
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    async function getInviteLink() {
        if (!customerEmail) {
            toast.error('O cliente precisa ter um e-mail cadastrado para receber o convite.')
            return null
        }

        const inviteCode = await getTenantInviteCode()
        if (!inviteCode) {
            toast.error('Empresa não possui código de convite configurado.')
            return null
        }

        const baseUrl = window.location.origin
        const params = new URLSearchParams({
            code: inviteCode,
            email: customerEmail,
            name: customerName
        })

        return `${baseUrl}/register?${params.toString()}`
    }

    async function handleWhatsApp() {
        setLoading(true)
        const link = await getInviteLink()
        setLoading(false)

        if (link) {
            const message = encodeURIComponent(
                `Olá ${customerName}! 👋\n\nPara facilitar seus agendamentos, criei seu acesso ao nosso sistema. Use o link abaixo para completar seu cadastro:\n\n${link}`
            )
            window.open(`https://wa.me/?text=${message}`, '_blank')
        }
    }

    async function handleCopy() {
        setLoading(true)
        const link = await getInviteLink()
        setLoading(false)

        if (link) {
            await navigator.clipboard.writeText(link)
            setCopied(true)
            toast.success('Link copiado para a área de transferência!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                onClick={handleWhatsApp}
                disabled={loading}
            >
                <MessageCircle className="h-3 w-3" />
                Convidar via WhatsApp
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 gap-2"
                onClick={handleCopy}
                disabled={loading}
            >
                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copiado!' : 'Copiar Link de Convite'}
            </Button>
        </div>
    )
}
