'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Link2, Copy, Check, Loader2, Share2 } from 'lucide-react'
import { generatePreAnamnesisLink } from './anamnesis-public-actions'
import { toast } from 'sonner'

interface PreAnamnesisLinkButtonProps {
    customerId: string
    customerName: string
}

export function PreAnamnesisLinkButton({ customerId, customerName }: PreAnamnesisLinkButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [link, setLink] = useState('')
    const [copied, setCopied] = useState(false)

    async function handleGenerate() {
        setLoading(true)
        const res = await generatePreAnamnesisLink(customerId)
        setLoading(false)
        if (res.success && res.link) {
            setLink(res.link)
        } else {
            toast.error(res.error || 'Erro ao gerar link.')
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast.success('Link copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Link2 className="h-4 w-4" />
                    Enviar Pré-Anamnese
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Link de Pré-Anamnese</DialogTitle>
                    <DialogDescription>
                        Envie este link para <strong>{customerName}</strong> preencher a ficha de anamnese sem precisar de login.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {!link ? (
                        <Button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                            Gerar Link Único
                        </Button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">Link</Label>
                                <Input
                                    id="link"
                                    defaultValue={link}
                                    readOnly
                                    className="h-9 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <Button size="sm" className="px-3 bg-indigo-600 hover:bg-indigo-700" onClick={copyToClipboard}>
                                <span className="sr-only">Copiar</span>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}

                    {link && (
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                                💡 Dica: Você pode copiar o link e enviar via WhatsApp. O aluno verá um formulário otimizado para preenchimento rápido.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

import { Label } from '@/components/ui/label'
