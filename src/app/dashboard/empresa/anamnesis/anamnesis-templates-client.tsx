'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Pencil, Loader2, FileText, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import {
    createAnamnesisTemplate,
    updateAnamnesisTemplate,
    deleteAnamnesisTemplate,
    reorderAnamnesisTemplates,
    type AnamnesisTemplate,
} from '../anamnesis-template-actions'

interface AnamnesisTemplatesClientProps {
    initialTemplates: AnamnesisTemplate[]
}

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: 'Texto curto',
    textarea: 'Texto longo',
    boolean: 'Sim / Não',
    select: 'Seleção',
}

export default function AnamnesisTemplatesClient({ initialTemplates }: AnamnesisTemplatesClientProps) {
    const [templates, setTemplates] = useState<AnamnesisTemplate[]>(initialTemplates)
    const [addOpen, setAddOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<AnamnesisTemplate | null>(null)
    const [newLabel, setNewLabel] = useState('')
    const [newType, setNewType] = useState('textarea')
    const [newOptions, setNewOptions] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleCreate() {
        if (!newLabel.trim()) {
            toast.error('O nome da pergunta é obrigatório.')
            return
        }
        setLoading(true)
        const options = newType === 'select' ? newOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined
        const res = await createAnamnesisTemplate(newLabel.trim(), newType, options)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Pergunta criada com sucesso!')
            setNewLabel('')
            setNewType('textarea')
            setNewOptions('')
            setAddOpen(false)
            // Refresh templates
            window.location.reload()
        }
        setLoading(false)
    }

    async function handleUpdate() {
        if (!editingTemplate || !editingTemplate.label.trim()) return
        setLoading(true)
        const options = editingTemplate.field_type === 'select' && newOptions
            ? newOptions.split(',').map(o => o.trim()).filter(Boolean)
            : editingTemplate.options || undefined
        const res = await updateAnamnesisTemplate(
            editingTemplate.id,
            editingTemplate.label,
            editingTemplate.field_type,
            editingTemplate.is_active,
            options as string[] | undefined
        )
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Pergunta atualizada!')
            setEditOpen(false)
            window.location.reload()
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return
        const res = await deleteAnamnesisTemplate(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Pergunta excluída!')
            setTemplates(prev => prev.filter(t => t.id !== id))
        }
    }

    async function handleToggleActive(template: AnamnesisTemplate) {
        const res = await updateAnamnesisTemplate(
            template.id,
            template.label,
            template.field_type,
            !template.is_active,
            template.options as string[] | undefined
        )
        if (res.error) {
            toast.error(res.error)
        } else {
            setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t))
        }
    }

    async function handleMove(index: number, direction: 'up' | 'down') {
        const newTemplates = [...templates]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        if (swapIndex < 0 || swapIndex >= newTemplates.length) return

        const temp = newTemplates[index]
        newTemplates[index] = newTemplates[swapIndex]
        newTemplates[swapIndex] = temp

        setTemplates(newTemplates)

        const orderedIds = newTemplates.map(t => t.id)
        const res = await reorderAnamnesisTemplates(orderedIds)
        if (res.error) {
            toast.error(res.error)
            setTemplates(templates) // Revert
        }
    }

    function openEdit(template: AnamnesisTemplate) {
        setEditingTemplate({ ...template })
        setNewOptions(template.options?.join(', ') || '')
        setEditOpen(true)
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-indigo-500" />
                        Perguntas de Anamnese
                    </h3>
                    <p className="text-sm text-muted-foreground italic">
                        Configure as perguntas que seus profissionais preencherão para cada cliente.
                    </p>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Pergunta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Pergunta</DialogTitle>
                            <DialogDescription>
                                Crie uma nova pergunta para a ficha de anamnese dos seus clientes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Pergunta / Título</Label>
                                <Input
                                    placeholder="Ex: Objetivo do tratamento"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Resposta</Label>
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="textarea">Texto longo</SelectItem>
                                        <SelectItem value="text">Texto curto</SelectItem>
                                        <SelectItem value="boolean">Sim / Não</SelectItem>
                                        <SelectItem value="select">Seleção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {newType === 'select' && (
                                <div className="space-y-2">
                                    <Label>Opções (separadas por vírgula)</Label>
                                    <Input
                                        placeholder="Ex: Leve, Moderado, Intenso"
                                        value={newOptions}
                                        onChange={(e) => setNewOptions(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={loading} className="gap-2">
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Criar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {templates.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="font-semibold text-lg mb-1">Nenhuma pergunta cadastrada</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Quando não há perguntas personalizadas, o sistema usa 3 perguntas padrão: <br />
                            <strong>Objetivo</strong>, <strong>Histórico de Saúde</strong> e <strong>Restrições</strong>.
                        </p>
                        <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Criar primeira pergunta
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {templates.map((template, index) => (
                        <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                            <CardContent className="flex items-center gap-3 py-3 px-4">
                                {/* Reorder */}
                                <div className="flex flex-col gap-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        disabled={index === 0}
                                        onClick={() => handleMove(index, 'up')}
                                    >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        disabled={index === templates.length - 1}
                                        onClick={() => handleMove(index, 'down')}
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{template.label}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {FIELD_TYPE_LABELS[template.field_type] || template.field_type}
                                        </Badge>
                                        {!template.is_active && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-500 border-red-200">
                                                Inativa
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleToggleActive(template)}
                                        title={template.is_active ? 'Desativar' : 'Ativar'}
                                    >
                                        {template.is_active
                                            ? <ToggleRight className="h-4 w-4 text-green-600" />
                                            : <ToggleLeft className="h-4 w-4 text-gray-400" />
                                        }
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEdit(template)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                        onClick={() => handleDelete(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Pergunta</DialogTitle>
                    </DialogHeader>
                    {editingTemplate && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Pergunta / Título</Label>
                                <Input
                                    value={editingTemplate.label}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, label: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Resposta</Label>
                                <Select
                                    value={editingTemplate.field_type}
                                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, field_type: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="textarea">Texto longo</SelectItem>
                                        <SelectItem value="text">Texto curto</SelectItem>
                                        <SelectItem value="boolean">Sim / Não</SelectItem>
                                        <SelectItem value="select">Seleção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editingTemplate.field_type === 'select' && (
                                <div className="space-y-2">
                                    <Label>Opções (separadas por vírgula)</Label>
                                    <Input
                                        value={newOptions}
                                        onChange={(e) => setNewOptions(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdate} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
