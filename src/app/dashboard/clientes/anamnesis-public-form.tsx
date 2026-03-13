'use client'

import { useState, useEffect } from 'react'
import { getPublicAnamnesisData, submitPublicAnamnesis } from './anamnesis-public-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface PublicAnamnesisFormProps {
    token: string
}

export function PublicAnamnesisForm({ token }: PublicAnamnesisFormProps) {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [data, setData] = useState<any>(null)
    const [values, setValues] = useState<Record<string, any>>({})

    useEffect(() => {
        async function load() {
            const res = await getPublicAnamnesisData(token)
            if (res.error) {
                toast.error(res.error)
            } else {
                setData(res)
                // Initialize values
                const initialValues: Record<string, any> = {}
                const templates = res.templates || []
                templates.forEach((field: any) => {
                    initialValues[field.id] = field.field_type === 'boolean' ? false : ''
                })
                setValues(initialValues)
            }
            setLoading(false)
        }
        load()
    }, [token])

    function updateValue(key: string, value: any) {
        setValues(prev => ({ ...prev, [key]: value }))
    }

    async function handleSubmit() {
        setSubmitting(true)
        const res = await submitPublicAnamnesis(token, values)
        setSubmitting(false)

        if (res.success) {
            setSubmitted(true)
            toast.success('Formulário enviado com sucesso!')
        } else {
            toast.error(res.error || 'Erro ao enviar.')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Carregando formulário...</p>
            </div>
        )
    }

    if (!data || data.error) {
        return (
            <Card className="border-green-100 bg-green-50/30">
                <CardContent className="pt-6 text-center">
                    <p className="text-green-700 font-medium">{data?.error || 'Link inválido ou expirado.'}</p>
                    <p className="text-sm text-green-600/70 mt-1">Por favor, entre em contato com o seu instrutor.</p>
                </CardContent>
            </Card>
        )
    }

    if (submitted) {
        return (
            <Card className="border-green-100 bg-green-50/30 overflow-hidden">
                <div className="h-2 bg-green-500" />
                <CardContent className="pt-10 pb-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-green-800">Tudo pronto!</CardTitle>
                        <CardDescription className="text-green-700/70 mt-2 text-base">
                            Sua ficha de anamnese foi enviada com sucesso para <strong>{data.tenantName}</strong>.
                        </CardDescription>
                    </div>
                    <p className="text-sm text-green-600/60 max-w-xs mx-auto">
                        Agora você já pode fechar esta aba. Nos vemos em breve!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-indigo-100 shadow-xl max-w-2xl mx-auto overflow-hidden">
            <div className="h-2 bg-indigo-600" />
            <CardHeader className="bg-slate-50/50 border-b">
                <div className="flex items-center gap-3 mb-2">
                    {data.tenantLogo ? (
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                            <img
                                src={data.tenantLogo}
                                alt={data.tenantName}
                                className="object-contain w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-xl">Ficha de Pré-Anamnese</CardTitle>
                        <CardDescription>{data.tenantName}</CardDescription>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                    Olá! Para oferecer o melhor atendimento, pedimos que preencha as informações abaixo.
                </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {data.templates.map((field: any) => (
                    <div key={field.id} className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">{field.label}</Label>
                        {(() => {
                            const key = field.id
                            const value = values[key]
                            switch (field.field_type) {
                                case 'text':
                                    return <Input value={value || ''} onChange={(e) => updateValue(key, e.target.value)} placeholder="Responda aqui..." className="border-slate-200 focus:border-indigo-500" />
                                case 'textarea':
                                    return <Textarea value={value || ''} onChange={(e) => updateValue(key, e.target.value)} placeholder="Descreva com detalhes..." rows={4} className="border-slate-200 focus:border-indigo-500 resize-none" />
                                case 'boolean':
                                    return (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <Switch checked={!!value} onCheckedChange={(checked) => updateValue(key, checked)} />
                                            <span className="text-sm font-medium text-slate-600">{value ? 'Sim' : 'Não'}</span>
                                        </div>
                                    )
                                case 'select':
                                    return (
                                        <Select value={value || ''} onValueChange={(v) => updateValue(key, v)}>
                                            <SelectTrigger className="border-slate-200">
                                                <SelectValue placeholder="Selecione uma opção..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(field.options || []).map((opt: string) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )
                                default:
                                    return <Input value={value || ''} onChange={(e) => updateValue(key, e.target.value)} />
                            }
                        })()}
                    </div>
                ))}

                <div className="pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-bold shadow-lg shadow-indigo-200"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Enviar Ficha
                            </>
                        )}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground mt-4">
                        Suas informações serão tratadas com segurança e privacidade.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
