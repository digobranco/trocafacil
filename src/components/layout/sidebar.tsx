'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Settings, Home, Dumbbell, UserCog, Building, CreditCard, BarChart3 } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: 'super_admin' | 'admin' | 'professional' | 'customer'
}

export function Sidebar({ className, role = 'customer' }: SidebarProps) {
    const pathname = usePathname()

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
    ]

    // Filtra itens baseados no role
    const items = role === 'customer'
        ? commonItems
        : role === 'admin'
            ? [...commonItems, ...adminItems, ...superAdminItems]
            : [...commonItems, ...adminItems]

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        TrocaFácil
                    </h2>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname === item.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={item.href}>
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
