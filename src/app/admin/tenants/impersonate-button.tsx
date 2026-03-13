'use client'

import { startImpersonation } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ImpersonateButtonProps {
    tenantId: string
}

export function ImpersonateButton({ tenantId }: ImpersonateButtonProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    const res = await startImpersonation(tenantId)
                    if (res?.error) {
                        toast.error(res.error)
                    } else if (res?.redirectTo) {
                        router.push(res.redirectTo)
                    }
                })
            }}
            title="Visualizar como este tenant"
        >
            <Eye className="h-4 w-4 mr-1" />
            {isPending ? 'Entrando...' : 'Logar como'}
        </Button>
    )
}

