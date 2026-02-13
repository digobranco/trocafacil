'use client'

import { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
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

                // Handle special cases for nested data (like credits)
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

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="ml-2 h-4 w-4 text-indigo-600" /> :
            <ChevronDown className="ml-2 h-4 w-4 text-indigo-600" />
    }

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por nome, email, telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white shadow-sm"
                />
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => handleSort('full_name')}
                            >
                                <div className="flex items-center">
                                    Nome <SortIcon columnKey="full_name" />
                                </div>
                            </TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => handleSort('email')}
                            >
                                <div className="flex items-center">
                                    Email <SortIcon columnKey="email" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-indigo-600 transition-colors text-center"
                                onClick={() => handleSort('credits')}
                            >
                                <div className="flex items-center justify-center">
                                    Créditos <SortIcon columnKey="credits" />
                                </div>
                            </TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedCustomers.length > 0 ? (
                            filteredAndSortedCustomers.map((customer) => {
                                const creditCount = customer.credits?.[0]?.quantity || 0

                                return (
                                    <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium whitespace-nowrap py-4">
                                            <Link href={`/dashboard/clientes/${customer.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                                                {customer.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{customer.phone || '-'}</TableCell>
                                        <TableCell className="truncate max-w-[200px]">{customer.email || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={creditCount > 0 ? 'default' : 'outline'} className={creditCount > 0 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-3" : "px-3"}>
                                                {creditCount} {creditCount === 1 ? 'crédito' : 'créditos'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={customer.active ? 'default' : 'secondary'} className={customer.active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-3" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 px-3"}>
                                                {customer.active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex justify-end items-center gap-2">
                                                <CustomerDialog
                                                    key={`edit-dialog-${customer.id}`}
                                                    customer={customer}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 h-8">
                                                            Editar
                                                        </Button>
                                                    }
                                                />
                                                <Button variant="outline" size="sm" asChild className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                                                    <Link href={`/dashboard/clientes/${customer.id}`}>Ver Detalhes</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 text-muted-foreground bg-slate-50/30">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p>Nenhum cliente encontrado para sua pesquisa.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
