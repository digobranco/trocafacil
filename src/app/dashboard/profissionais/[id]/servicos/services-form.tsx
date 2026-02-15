'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateProfessionalServices, type ServiceConfig } from './actions'

type Service = {
    id: string
    name: string
    description: string | null
    price: number | null
    durationMinutes: number
    isLinked: boolean
    customPrice: number | null
    customDuration: number | null
}

type ServicesFormProps = {
    professionalId: string
    services: Service[]
}

export function ServicesForm({ professionalId, services }: ServicesFormProps) {
    const router = useRouter()
    const [selectedServices, setSelectedServices] = useState<Map<string, ServiceConfig>>(
        new Map(
            services
                .filter(s => s.isLinked)
                .map(s => [
                    s.id,
                    {
                        serviceId: s.id,
                        customPrice: s.customPrice,
                        customDuration: s.customDuration
                    }
                ])
        )
    )
    const [isSaving, setIsSaving] = useState(false)

    const handleToggleService = (serviceId: string) => {
        setSelectedServices(prev => {
            const newMap = new Map(prev)
            if (newMap.has(serviceId)) {
                newMap.delete(serviceId)
            } else {
                newMap.set(serviceId, { serviceId })
            }
            return newMap
        })
    }

    const handleUpdateConfig = (
        serviceId: string,
        field: 'customPrice' | 'customDuration',
        value: number | null
    ) => {
        setSelectedServices(prev => {
            const newMap = new Map(prev)
            const current = newMap.get(serviceId)
            if (current) {
                newMap.set(serviceId, { ...current, [field]: value })
            }
            return newMap
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const configs = Array.from(selectedServices.values())
            const result = await updateProfessionalServices(professionalId, configs)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Serviços atualizados com sucesso!')
                router.refresh()
            }
        } catch (error) {
            console.error('Error saving services:', error)
            toast.error('Erro ao salvar serviços')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border rounded-lg divide-y">
                {services.map(service => {
                    const isSelected = selectedServices.has(service.id)
                    const config = selectedServices.get(service.id)

                    return (
                        <div key={service.id} className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id={`service-${service.id}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleService(service.id)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300"
                                />
                                <div className="flex-1">
                                    <label
                                        htmlFor={`service-${service.id}`}
                                        className="font-medium cursor-pointer"
                                    >
                                        {service.name}
                                    </label>
                                    {service.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {service.description}
                                        </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                        <span>
                                            Preço padrão:{' '}
                                            {service.price
                                                ? `R$ ${service.price.toFixed(2)}`
                                                : 'Não definido'}
                                        </span>
                                        <span>Duração: {service.durationMinutes} min</span>
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
                                                        handleUpdateConfig(service.id, 'customPrice', service.price || 0)
                                                    } else {
                                                        handleUpdateConfig(service.id, 'customPrice', null)
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
                                                        service.id,
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
                                                        handleUpdateConfig(service.id, 'customDuration', service.durationMinutes)
                                                    } else {
                                                        handleUpdateConfig(service.id, 'customDuration', null)
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
                                                        service.id,
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
                })}
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
