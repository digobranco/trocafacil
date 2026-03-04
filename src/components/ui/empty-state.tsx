import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
    className?: string
    children?: React.ReactNode
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    className,
    children
}: EmptyStateProps) {
    return (
        <Card className={`flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-slate-50/50 ${className}`}>
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                <Icon className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-xs mb-8 leading-relaxed">
                {description}
            </p>
            <div className="flex flex-col items-center gap-4">
                {actionLabel && actionHref && (
                    <Button asChild size="lg" className="px-8 shadow-md">
                        <Link href={actionHref}>
                            {actionLabel}
                        </Link>
                    </Button>
                )}
                {children}
            </div>
        </Card>
    )
}
