'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Settings, Home, Dumbbell, UserCog, Building, CreditCard, BarChart3, FileText } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: 'super_admin' | 'admin' | 'professional' | 'customer'
    onNavigate?: () => void
    tenantLogo?: string | null
    tenantName?: string | null
}

export function Sidebar({ className, role = 'customer', onNavigate, tenantLogo, tenantName }: SidebarProps) {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    // Itens visíveis para todos (exceto super_admin que tem layout próprio)
    const commonItems = [
        {
            title: 'Início',
            href: '/dashboard',
            icon: Home,
        },
        {
            title: 'Minha Agenda',
            href: '/dashboard/agenda',
            icon: Calendar,
        },
    ]

    // Itens administrativos (Admin ou Profissional)
    const adminItems = [
        {
            title: 'Serviços',
            href: '/dashboard/servicos',
            icon: Dumbbell,
        },
        {
            title: 'Clientes',
            href: '/dashboard/clientes',
            icon: Users,
        },
        {
            title: 'Planos',
            href: '/dashboard/planos',
            icon: CreditCard,
        },
        {
            title: 'Relatórios',
            href: '/dashboard/relatorios',
            icon: BarChart3,
        },
    ]

    const superAdminItems = [
        {
            title: 'Perfil Usuário (Equipe)',
            href: '/dashboard/equipe',
            icon: UserCog,
        },
        {
            title: 'Profissionais',
            href: '/dashboard/profissionais',
            icon: UserCog,
        },
        {
            title: 'Empresa',
            href: '/dashboard/empresa',
            icon: Building,
        },
        {
            title: 'Anamnese',
            href: '/dashboard/empresa/anamnesis',
            icon: FileText,
        },
    ]

    // Filtra itens baseados no role
    const items = role === 'customer'
        ? commonItems
        : role === 'admin'
            ? [...commonItems, ...adminItems, ...superAdminItems]
            : [...commonItems, ...adminItems]

    const displayName = tenantName || 'TrocaFácil'

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    {/* Tenant Branding */}
                    <div className="mb-4 px-4 flex items-center gap-3">
                        {tenantLogo ? (
                            <img
                                src={tenantLogo}
                                alt={displayName}
                                className="w-9 h-9 rounded-lg object-contain border bg-white shadow-sm flex-shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h2 className="text-base font-semibold tracking-tight truncate">
                            {displayName}
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Button
                                key={item.href}
                                variant={isActive(item.href) ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    isActive(item.href) && "bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-l-none"
                                )}
                                asChild
                            >
                                <Link href={item.href} onClick={onNavigate}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
