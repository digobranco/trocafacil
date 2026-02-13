'use client'

import { useState, useEffect } from 'react'
import { getCustomerCreditLogs } from './actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Clock,
    PlusCircle,
    MinusCircle,
    RefreshCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreditLog {
    id: string
    quantity_change: number
    type: 'usage' | 'addition' | 'cancellation_refund' | 'manual_adjustment'
    notes: string
    created_at: string
}

interface CreditHistoryProps {
    customerId: string
}

export function CreditHistory({ customerId }: CreditHistoryProps) {
    const [logs, setLogs] = useState<CreditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLogs()

        // Listen for credit updates to refresh history
        window.addEventListener('credit-updated', loadLogs)
        return () => window.removeEventListener('credit-updated', loadLogs)
    }, [customerId])

    async function loadLogs() {
        setLoading(true)
        try {
            const data = await getCustomerCreditLogs(customerId)
            setLogs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (type: string, change: number) => {
        if (type === 'usage') return <MinusCircle className="h-4 w-4 text-red-500" />
        if (type === 'cancellation_refund') return <RefreshCcw className="h-4 w-4 text-green-500" />
        if (type === 'manual_adjustment') {
            return change > 0
                ? <PlusCircle className="h-4 w-4 text-indigo-500" />
                : <MinusCircle className="h-4 w-4 text-amber-500" />
        }
        return <PlusCircle className="h-4 w-4 text-blue-500" />
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'usage': return <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-100">USO</Badge>
            case 'cancellation_refund': return <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-100">REEMBOLSO</Badge>
            case 'manual_adjustment': return <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100">MANUAL</Badge>
            default: return <Badge variant="outline" className="text-[10px]">OUTRO</Badge>
        }
    }

    if (loading) {
        return <div className="py-8 text-center text-sm text-muted-foreground">Carregando histórico...</div>
    }

    if (logs.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-lg">
                Nenhuma movimentação de crédito registrada.
            </div>
        )
    }

    return (
        <div className="h-[300px] pr-4 overflow-y-auto">
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 relative pb-4 border-l-2 border-slate-100 ml-2 pl-4 last:pb-0">
                        <div className="absolute -left-[9px] top-0 bg-white rounded-full">
                            {getIcon(log.type, log.quantity_change)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={log.quantity_change > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                                    </span>
                                    {getTypeBadge(log.type)}
                                </div>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-normal">
                                {log.notes}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
