'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateServiceProfessionals, type ProfessionalConfig } from './actions'
import { UserCog } from 'lucide-react'

type Professional = {
    id: string
    name: string
    specialty: string | null
    isLinked: boolean
    customPrice: number | null
    customDuration: number | null
}

type ProfessionalsFormProps = {
    serviceId: string
    professionals: Professional[]
    defaultServicePrice: number | null
    defaultServiceDuration: number
}

export function ProfessionalsForm({
    serviceId,
    professionals,
    defaultServicePrice,
    defaultServiceDuration
}: ProfessionalsFormProps) {
    const router = useRouter()
    const [selectedProfessionals, setSelectedProfessionals] = useState<Map<string, ProfessionalConfig>>(
        new Map(
            professionals
                .filter(p => p.isLinked)
                .map(p => [
                    p.id,
                    {
                        professionalId: p.id,
                        customPrice: p.customPrice,
                        customDuration: p.customDuration
                    }
                ])
        )
    )
    const [isSaving, setIsSaving] = useState(false)

    const handleToggleProfessional = (professionalId: string) => {
        setSelectedProfessionals(prev => {
            const newMap = new Map(prev)
            if (newMap.has(professionalId)) {
                newMap.delete(professionalId)
            } else {
                newMap.set(professionalId, { professionalId })
            }
            return newMap
        })
    }

    const handleUpdateConfig = (
        professionalId: string,
        field: 'customPrice' | 'customDuration',
        value: number | null
    ) => {
        setSelectedProfessionals(prev => {
            const newMap = new Map(prev)
            const current = newMap.get(professionalId)
            if (current) {
                newMap.set(professionalId, { ...current, [field]: value })
            }
            return newMap
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const configs = Array.from(selectedProfessionals.values())
            const result = await updateServiceProfessionals(serviceId, configs)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profissionais vinculados com sucesso!')
                router.push('/dashboard/servicos')
            }
        } catch (error) {
            console.error('Error saving professionals:', error)
            toast.error('Erro ao salvar profissionais')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border rounded-lg divide-y bg-white">
                {professionals.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhum profissional cadastrado no sistema.
                    </div>
                ) : (
                    professionals.map(prof => {
                        const isSelected = selectedProfessionals.has(prof.id)
                        const config = selectedProfessionals.get(prof.id)

                        return (
                            <div key={prof.id} className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id={`prof-${prof.id}`}
                                        checked={isSelected}
                                        onChange={() => handleToggleProfessional(prof.id)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`prof-${prof.id}`}
                                            className="font-medium cursor-pointer"
                                        >
                                            {prof.name}
                                        </label>
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span>
                                                Especialidade: {prof.specialty || 'Não definida'}
                                            </span>
                                            <span>
                                                Preço padrão:{' '}
                                                {defaultServicePrice
                                                    ? `R$ ${defaultServicePrice.toFixed(2)}`
                                                    : 'Não definido'}
                                            </span>
                                            <span>Duração: {defaultServiceDuration} min</span>
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="ml-7 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={config?.customPrice !== null && config?.customPrice !== undefined}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            handleUpdateConfig(prof.id, 'customPrice', defaultServicePrice || 0)
                                                        } else {
                                                            handleUpdateConfig(prof.id, 'customPrice', null)
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                Preço customizado
                                            </label>
                                            {config?.customPrice !== null && config?.customPrice !== undefined && (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={config.customPrice || ''}
                                                    onChange={(e) =>
                                                        handleUpdateConfig(
                                                            prof.id,
                                                            'customPrice',
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={config?.customDuration !== null && config?.customDuration !== undefined}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            handleUpdateConfig(prof.id, 'customDuration', defaultServiceDuration)
                                                        } else {
                                                            handleUpdateConfig(prof.id, 'customDuration', null)
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                Duração customizada
                                            </label>
                                            {config?.customDuration !== null && config?.customDuration !== undefined && (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={config.customDuration || ''}
                                                    onChange={(e) =>
                                                        handleUpdateConfig(
                                                            prof.id,
                                                            'customDuration',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    placeholder="Minutos"
                                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    )
}
