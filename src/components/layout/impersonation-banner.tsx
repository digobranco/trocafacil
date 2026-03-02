'use client'

import { stopImpersonation } from '@/app/admin/actions'
import { X } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ImpersonationBannerProps {
    tenantName: string
}

export function ImpersonationBanner({ tenantName }: ImpersonationBannerProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium z-50">
            <div className="flex items-center gap-2">
                <span className="text-base">🔍</span>
                <span>
                    Visualizando como: <strong>{tenantName}</strong>
                </span>
                <span className="text-amber-800 text-xs">(Super Admin)</span>
            </div>
            <button
                disabled={isPending}
                onClick={() => {
                    startTransition(async () => {
                        const res = await stopImpersonation()
                        if (res?.redirectTo) {
                            router.push(res.redirectTo)
                        }
                    })
                }}
                className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 rounded-md transition-colors text-xs font-semibold"
            >
                <X className="h-3 w-3" />
                {isPending ? 'Saindo...' : 'Sair da visualização'}
            </button>
        </div>
    )
}
