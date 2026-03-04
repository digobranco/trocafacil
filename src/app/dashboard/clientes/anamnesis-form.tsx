'use client'

import { useState } from 'react'
import { saveAnamnesis } from './clinical-actions'
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
import { Loader2, Save, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface AnamnesisTemplate {
    id: string
    label: string
    field_type: 'text' | 'textarea' | 'boolean' | 'select'
    options: string[] | null
    sort_order: number
}

interface AnamnesisFormProps {
    customerId: string
    initialData?: any
    templates?: AnamnesisTemplate[]
}

// Default questions used when no custom templates exist
const DEFAULT_FIELDS = [
    { id: 'objective', label: 'Objetivo do Aluno', field_type: 'textarea' as const, options: null, sort_order: 0, placeholder: 'Ex: Fortalecimento lombar, flexibilidade...' },
    { id: 'history', label: 'Histórico de Saúde / Patologias', field_type: 'textarea' as const, options: null, sort_order: 1, placeholder: 'Ex: Hérnia de disco L4-L5, cirurgias anteriores...' },
    { id: 'restrictions', label: 'Restrições / Observações Importantes', field_type: 'textarea' as const, options: null, sort_order: 2, placeholder: 'Ex: Evitar flexão excessiva de tronco...' },
]

export function AnamnesisForm({ customerId, initialData, templates }: AnamnesisFormProps) {
    const useCustomTemplates = templates && templates.length > 0
    const fields = useCustomTemplates ? templates : DEFAULT_FIELDS

    // Build initial values from saved data
    const buildInitialValues = () => {
        const values: Record<string, any> = {}
        const savedContent = initialData?.content || {}

        for (const field of fields) {
            const key = field.id
            if (savedContent[key] !== undefined) {
                values[key] = savedContent[key]
            } else {
                // Default value based on type
                values[key] = field.field_type === 'boolean' ? false : ''
            }
        }
        return values
    }

    const [loading, setLoading] = useState(false)
    const [values, setValues] = useState<Record<string, any>>(buildInitialValues)

    function updateValue(key: string, value: any) {
        setValues(prev => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        setLoading(true)
        const res = await saveAnamnesis(customerId, values)
        setLoading(false)

        if (res.success) {
            toast.success('Anamnese salva com sucesso!')
        } else {
            toast.error(res.error || 'Erro ao salvar.')
        }
    }

    function renderField(field: typeof fields[0]) {
        const key = field.id
        const value = values[key]

        switch (field.field_type) {
            case 'text':
                return (
                    <Input
                        value={value || ''}
                        onChange={(e) => updateValue(key, e.target.value)}
                        placeholder={'placeholder' in field ? (field as any).placeholder : `Responda aqui...`}
                    />
                )
            case 'textarea':
                return (
                    <Textarea
                        value={value || ''}
                        onChange={(e) => updateValue(key, e.target.value)}
                        placeholder={'placeholder' in field ? (field as any).placeholder : `Responda aqui...`}
                        rows={3}
                    />
                )
            case 'boolean':
                return (
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={!!value}
                            onCheckedChange={(checked) => updateValue(key, checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                            {value ? 'Sim' : 'Não'}
                        </span>
                    </div>
                )
            case 'select':
                const options = field.options || []
                return (
                    <Select value={value || ''} onValueChange={(v) => updateValue(key, v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            default:
                return (
                    <Input
                        value={value || ''}
                        onChange={(e) => updateValue(key, e.target.value)}
                    />
                )
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Ficha de Anamnese
                </CardTitle>
                <CardDescription>
                    {useCustomTemplates
                        ? 'Preencha os campos definidos pela sua empresa'
                        : 'Resumo técnico e histórico inicial do aluno'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label>{field.label}</Label>
                        {renderField(field)}
                    </div>
                ))}

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
