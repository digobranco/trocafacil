'use client'

import { useState } from 'react'
import { saveAnamnesis } from './clinical-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface AnamnesisFormProps {
    customerId: string
    initialData?: any
}

export function AnamnesisForm({ customerId, initialData }: AnamnesisFormProps) {
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState(initialData?.content?.objective || '')
    const [history, setHistory] = useState(initialData?.content?.history || '')
    const [restrictions, setRestrictions] = useState(initialData?.content?.restrictions || '')

    async function handleSave() {
        setLoading(true)
        const data = {
            objective: content,
            history: history,
            restrictions: restrictions
        }

        const res = await saveAnamnesis(customerId, data)
        setLoading(false)

        if (res.success) {
            toast.success('Anamnese salva com sucesso!')
        } else {
            toast.error(res.error || 'Erro ao salvar.')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Ficha de Anamnese
                </CardTitle>
                <CardDescription>Resumo técnico e histórico inicial do aluno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Objetivo do Aluno</Label>
                    <Textarea
                        placeholder="Ex: Fortalecimento lombar, flexibilidade..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Histórico de Saúde / Patologias</Label>
                    <Textarea
                        placeholder="Ex: Hérnia de disco L4-L5, cirurgias anteriores..."
                        value={history}
                        onChange={(e) => setHistory(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Restrições / Observações Importantes</Label>
                    <Textarea
                        placeholder="Ex: Evitar flexão excessiva de tronco..."
                        value={restrictions}
                        onChange={(e) => setRestrictions(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar Anamnese
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
