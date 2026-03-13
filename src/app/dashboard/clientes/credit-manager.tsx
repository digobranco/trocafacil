'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Loader2 } from 'lucide-react'
import { adjustCustomerCredits } from './actions'

interface CreditBucket {
    id: string
    quantity: number
    membership_plan_id: string | null
    service_restrictions: string[] | null
    plan?: { name: string }
}

interface CreditManagerProps {
    customerId: string
    credits: CreditBucket[]
}

export function CreditManager({ customerId, credits: initialCredits }: CreditManagerProps) {
    const [loading, setLoading] = useState(false)
    const [currentCredits, setCurrentCredits] = useState<CreditBucket[]>(initialCredits)

    const totalCredits = currentCredits.reduce((acc, c) => acc + (c.quantity || 0), 0)
    const generalBucket = currentCredits.find(c => !c.membership_plan_id)
    const generalQuantity = generalBucket?.quantity || 0

    async function handleAdjust(delta: number) {
        setLoading(true)
        try {
            const res = await adjustCustomerCredits(customerId, delta)
            if (res.success) {
                // Update general bucket locally
                setCurrentCredits(prev => {
                    const existing = prev.find(c => !c.membership_plan_id)
                    if (existing) {
                        return prev.map(c => !c.membership_plan_id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
                    } else {
                        // If it didn't exist, we'd need its ID from the response or re-fetch. 
                        // For simplicity, let's just trigger a refresh of the page or wait for the event.
                        window.location.reload()
                        return prev
                    }
                })
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
        <div className="flex flex-col gap-5 p-4 border rounded-xl bg-slate-50">
            <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Saldos Atuais</span>
                
                {currentCredits.map((bucket, idx) => (
                    <div key={bucket.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-700">
                                {bucket.plan?.name || "Créditos Avulsos"}
                            </p>
                            {bucket.service_restrictions && bucket.service_restrictions.length > 0 && (
                                <p className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-full inline-block">
                                    Restrito
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-indigo-700">{bucket.quantity}</span>
                            <span className="text-[10px] text-indigo-400 font-medium">UN</span>
                        </div>
                    </div>
                ))}
                
                {currentCredits.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-2">Nenhum crédito disponível</p>
                )}
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajuste Manual (Avulsos)</span>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px] animate-pulse">
                        Geral: {generalQuantity}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 text-xs"
                        onClick={() => handleAdjust(-1)}
                        disabled={loading || generalQuantity <= 0}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4 mr-1.5" />}
                        Remover 1
                    </Button>
                    <Button
                        variant="outline"
                        className="border-green-100 text-green-600 hover:bg-green-50 hover:text-green-700 h-9 text-xs"
                        onClick={() => handleAdjust(1)}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                        Adicionar 1
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        className="flex-1 border-blue-100 text-blue-600 hover:bg-blue-50 h-8 text-xs"
                        onClick={() => handleAdjust(5)}
                        disabled={loading}
                    >
                        +5 Avulsos
                    </Button>
                    <Button
                        variant="secondary"
                        className="flex-1 border-blue-100 text-blue-600 hover:bg-blue-50 h-8 text-xs"
                        onClick={() => handleAdjust(10)}
                        disabled={loading}
                    >
                        +10 Avulsos
                    </Button>
                </div>
            </div>
        </div>
    )
}
