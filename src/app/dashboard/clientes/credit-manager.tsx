'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Loader2 } from 'lucide-react'
import { adjustCustomerCredits } from './actions'

interface CreditManagerProps {
    customerId: string
    initialCredits: number
}

export function CreditManager({ customerId, initialCredits }: CreditManagerProps) {
    const [loading, setLoading] = useState(false)
    const [currentCredits, setCurrentCredits] = useState(initialCredits)

    async function handleAdjust(delta: number) {
        setLoading(true)
        try {
            const res = await adjustCustomerCredits(customerId, delta)
            if (res.success) {
                // Update local state for immediate feedback
                setCurrentCredits(prev => Math.max(0, prev + delta))
                // Dispatch event for other components to refresh
                window.dispatchEvent(new CustomEvent('credit-updated'))
            } else if (res.error) {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao processar créditos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-xl bg-slate-50">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saldo de Créditos</span>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-bold text-indigo-700">{currentCredits}</span>
                    <span className="text-xs text-indigo-500 font-medium self-end mb-1">UN</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleAdjust(-1)}
                    disabled={loading || currentCredits <= 0}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-5 w-5 mr-2" />}
                    Remover
                </Button>
                <Button
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleAdjust(1)}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                    Adicionar
                </Button>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleAdjust(5)}
                    disabled={loading}
                >
                    +5 Créditos
                </Button>
                <Button
                    variant="secondary"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleAdjust(10)}
                    disabled={loading}
                >
                    +10 Créditos
                </Button>
            </div>
        </div>
    )
}
