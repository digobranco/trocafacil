'use client'

import { useState } from 'react'
import { addEvolution } from './clinical-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Send, History as HistoryIcon, User } from 'lucide-react'
import { toast } from 'sonner'

interface Evolution {
    id: string
    content: string
    created_at: string
    professional?: {
        full_name: string
    }
}

interface EvolutionTimelineProps {
    customerId: string
    initialEvolutions: Evolution[]
}

export function EvolutionTimeline({ customerId, initialEvolutions }: EvolutionTimelineProps) {
    const [loading, setLoading] = useState(false)
    const [newEvolution, setNewEvolution] = useState('')
    const [evolutions, setEvolutions] = useState(initialEvolutions)

    async function handleSubmit() {
        if (!newEvolution.trim()) return

        setLoading(true)
        const res = await addEvolution(customerId, newEvolution)
        setLoading(false)

        if (res.success) {
            toast.success('Evolução registrada!')
            // Idealmente recarregaríamos via revalidatePath, 
            // mas para feedback imediato na UI de cliente:
            setEvolutions([
                {
                    id: Math.random().toString(),
                    content: newEvolution,
                    created_at: new Date().toISOString(),
                    professional: { full_name: 'Você (agora)' }
                },
                ...evolutions
            ])
            setNewEvolution('')
        } else {
            toast.error(res.error || 'Erro ao registrar.')
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-indigo-100 bg-indigo-50/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-md font-semibold">Nova Evolução</CardTitle>
                    <CardDescription>Registre o que foi trabalhado na sessão de hoje</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Textarea
                        placeholder="Descreva a evolução, exercícios realizados, queixas ou melhoras..."
                        value={newEvolution}
                        onChange={(e) => setNewEvolution(e.target.value)}
                        rows={3}
                        className="bg-white"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={loading || !newEvolution.trim()} className="gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Registrar Evolução
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2 px-1">
                    <HistoryIcon className="h-4 w-4 text-slate-400" />
                    Histórico de Evoluções
                </h4>

                {evolutions.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground italic">
                        Nenhuma evolução registrada para este aluno ainda.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {evolutions.map((evo) => (
                            <div key={evo.id} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-bold text-slate-600">
                                                {format(new Date(evo.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                                <User className="h-3 w-3" />
                                                {evo.professional?.full_name || 'Profissional'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap shadow-sm">
                                        {evo.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
