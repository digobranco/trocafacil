'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, CalendarDays, Users, Phone, Mail, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { ViewToggle, useViewToggle } from '@/components/ui/view-toggle'
import { EmptyState } from '@/components/ui/empty-state'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { CustomerDialog } from './new-customer-dialog'

interface CustomerTableProps {
    initialCustomers: any[]
}

type SortConfig = {
    key: string
    direction: 'asc' | 'desc' | null
}

export function CustomerTable({ initialCustomers }: CustomerTableProps) {
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' })
    const { view, toggle } = useViewToggle('clientes-view')

    const filteredAndSortedCustomers = useMemo(() => {
        let result = [...initialCustomers]

        // Search Filter
        if (search) {
            const lowSearch = search.toLowerCase()
            result = result.filter(c =>
                c.full_name?.toLowerCase().includes(lowSearch) ||
                c.email?.toLowerCase().includes(lowSearch) ||
                c.phone?.toLowerCase().includes(lowSearch) ||
                c.notes?.toLowerCase().includes(lowSearch)
            )
        }

        // Sorting
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                if (sortConfig.key === 'credits') {
                    aValue = a.credits?.[0]?.quantity || 0
                    bValue = b.credits?.[0]?.quantity || 0
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [initialCustomers, search, sortConfig])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por nome, email, telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white shadow-sm"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSortConfig({ key: 'full_name', direction: sortConfig.key === 'full_name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                        Nome {sortConfig.key === 'full_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSortConfig({ key: 'credits', direction: sortConfig.key === 'credits' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                        Créditos {sortConfig.key === 'credits' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    <ViewToggle view={view} onToggle={toggle} />
                </div>
            </div>

            {filteredAndSortedCustomers.length > 0 ? (
                <>
                    {/* List View — desktop only */}
                    {view === 'list' ? (
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Créditos</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedCustomers.map((customer) => {
                                        const creditCount = customer.credits?.[0]?.quantity || 0
                                        const activeMembership = customer.client_memberships?.find((m: any) => m.status === 'active')
                                        const planName = activeMembership?.membership_plans?.name
                                        return (
                                            <TableRow key={customer.id} className={!customer.active ? 'opacity-60' : ''}>
                                                <TableCell className="min-w-0">
                                                    <Link href={`/dashboard/clientes/${customer.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors break-all">
                                                        {customer.full_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm">{customer.phone || '—'}</TableCell>
                                                <TableCell className="text-sm break-all">{customer.email || '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={creditCount > 0 ? 'default' : 'outline'} className={creditCount > 0 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-2" : "px-2"}>
                                                        {creditCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {customer.client_memberships
                                                            ?.filter((m: any) => m.status === 'active')
                                                            .map((m: any, idx: number, arr: any[]) => {
                                                                if (idx === 0) {
                                                                    return (
                                                                        <Badge key={m.id} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 px-2 whitespace-nowrap">
                                                                            {m.membership_plans?.name}
                                                                        </Badge>
                                                                    )
                                                                }
                                                                if (idx === 1) {
                                                                    return (
                                                                        <Badge key="more" variant="outline" className="text-[10px] text-slate-500 border-slate-200 px-1">
                                                                            +{arr.length - 1}
                                                                        </Badge>
                                                                    )
                                                                }
                                                                return null
                                                            })}
                                                        {!customer.client_memberships?.some((m: any) => m.status === 'active') && (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={customer.active ? 'default' : 'secondary'}
                                                        className={customer.active
                                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                                        }
                                                    >
                                                        {customer.active ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" asChild className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                        <Link href={`/dashboard/clientes/${customer.id}`}>Detalhes</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}

                    {/* Card View — always on mobile, toggle on desktop */}
                    <div className={view === 'list' ? 'md:hidden' : ''}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedCustomers.map((customer) => {
                                const creditCount = customer.credits?.[0]?.quantity || 0
                                const activeMemberships = customer.client_memberships?.filter((m: any) => m.status === 'active') || []

                                return (
                                    <Card key={customer.id} className={!customer.active ? 'opacity-60' : ''}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <Users className="h-5 w-5 text-primary shrink-0 mt-1" />
                                                    <CardTitle className="text-lg min-w-0">
                                                        <Link href={`/dashboard/clientes/${customer.id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors break-all block">
                                                            {customer.full_name}
                                                        </Link>
                                                    </CardTitle>
                                                </div>
                                                <Badge
                                                    variant={customer.active ? 'default' : 'secondary'}
                                                    className={customer.active
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 shrink-0"
                                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 shrink-0"
                                                    }
                                                >
                                                    {customer.active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="space-y-1.5 text-sm">
                                                {customer.phone && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3.5 w-3.5" /> Telefone:
                                                        </span>
                                                        <span className="font-medium">{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3.5 w-3.5" /> Email:
                                                        </span>
                                                        <span className="font-medium break-all ml-4 block text-right">{customer.email}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <CreditCard className="h-3.5 w-3.5" /> Créditos:
                                                    </span>
                                                    <Badge variant={creditCount > 0 ? 'default' : 'outline'} className={creditCount > 0 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-2" : "px-2"}>
                                                        {creditCount} {creditCount === 1 ? 'crédito' : 'créditos'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <CalendarDays className="h-3.5 w-3.5" /> Planos Ativos:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {activeMemberships.length > 0 ? (
                                                            activeMemberships.map((m: any) => (
                                                                <Badge key={m.id} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 px-2 gap-1 text-[11px]">
                                                                    {m.membership_plans?.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-400 px-2">Sem plano ativo</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <Button variant="outline" size="sm" asChild className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                                                    <Link href={`/dashboard/clientes/${customer.id}`}>Detalhes</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : search ? (
                <EmptyState
                    icon={Search}
                    title="Nenhum cliente encontrado"
                    description={`Não encontramos resultados para "${search}". Tente outro termo ou limpe o filtro.`}
                    className="mt-4"
                />
            ) : (
                <EmptyState
                    icon={Users}
                    title="Sua lista de clientes está vazia"
                    description="Cadastre seus alunos ou envie o link de convite para que eles mesmos se cadastrem e comecem a agendar."
                    className="mt-4"
                >
                    <CustomerDialog
                        trigger={
                            <Button size="lg" className="px-8 shadow-md">
                                Cadastrar Meu Primeiro Cliente
                            </Button>
                        }
                    />
                </EmptyState>
            )}
        </div>
    )
}
