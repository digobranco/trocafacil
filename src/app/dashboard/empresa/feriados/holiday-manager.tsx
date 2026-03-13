'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon, Info, Search, ArrowUpDown, SortAsc, SortDesc, X, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Holiday, createHoliday, deleteHoliday } from './actions'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface HolidayManagerProps {
    initialHolidays: Holiday[]
}

type SortField = 'name' | 'start_date' | 'is_national'
type SortConfig = {
    field: SortField
    direction: 'asc' | 'desc'
}

export function HolidayManager({ initialHolidays }: HolidayManagerProps) {
    const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    // Filters and Sorting State
    const [searchQuery, setSearchQuery] = useState('')
    const [startDateFilter, setStartDateFilter] = useState('')
    const [endDateFilter, setEndDateFilter] = useState('')
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'start_date', direction: 'asc' })

    const filteredAndSortedHolidays = useMemo(() => {
        let result = [...holidays]

        // Filter by Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(h => h.name.toLowerCase().includes(query))
        }

        // Filter by Date Range
        if (startDateFilter || endDateFilter) {
            result = result.filter(h => {
                const holidayStart = startOfDay(parseISO(h.start_date))
                const holidayEnd = endOfDay(parseISO(h.end_date))

                if (startDateFilter && endDateFilter) {
                    const filterStart = startOfDay(parseISO(startDateFilter))
                    const filterEnd = endOfDay(parseISO(endDateFilter))
                    // Check if holiday overlaps with filter range
                    return (holidayStart <= filterEnd && holidayEnd >= filterStart)
                } else if (startDateFilter) {
                    const filterStart = startOfDay(parseISO(startDateFilter))
                    return holidayEnd >= filterStart
                } else if (endDateFilter) {
                    const filterEnd = endOfDay(parseISO(endDateFilter))
                    return holidayStart <= filterEnd
                }
                return true
            })
        }

        // Sort
        result.sort((a, b) => {
            let aValue: any = a[sortConfig.field]
            let bValue: any = b[sortConfig.field]

            if (sortConfig.field === 'is_national') {
                aValue = a.is_national ? 1 : 0
                bValue = b.is_national ? 1 : 0
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [holidays, searchQuery, startDateFilter, endDateFilter, sortConfig])

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const startDate = formData.get('startDate') as string
        const endDate = formData.get('endDate') as string || startDate
        const repeatTenYears = formData.get('repeatTenYears') === 'on'

        const result = await createHoliday({ name, startDate, endDate, repeatTenYears })

        if (result.success) {
            toast.success('Feriado/Recesso cadastrado com sucesso!')
            setIsDialogOpen(false)
            window.location.reload()
        } else {
            toast.error(result.error || 'Erro ao cadastrar.')
        }
        setIsPending(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este feriado regional?')) return

        const result = await deleteHoliday(id)
        if (result.success) {
            toast.success('Feriado excluído.')
            setHolidays(holidays.filter(h => h.id !== id))
        } else {
            toast.error(result.error || 'Erro ao excluir.')
        }
    }

    const toggleSort = (field: SortField) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortConfig.direction === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />
    }

    const clearFilters = () => {
        setSearchQuery('')
        setStartDateFilter('')
        setEndDateFilter('')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Feriados e Recessos</h2>
                    <p className="text-muted-foreground">
                        Gerencie os feriados nacionais, regionais e períodos de fechamento da empresa.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Feriado/Recesso
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Feriado ou Recesso</DialogTitle>
                                <DialogDescription>
                                    Adicione um feriado regional ou um período em que a empresa estará fechada.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome do Evento</Label>
                                    <Input id="name" name="name" placeholder="Ex: Feriado Municipal, Recesso de Fim de Ano" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="startDate">Data de Início</Label>
                                        <Input id="startDate" name="startDate" type="date" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endDate">Data de Fim (Opcional)</Label>
                                        <Input id="endDate" name="endDate" type="date" placeholder="Mesma que o início" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                                    <input 
                                        type="checkbox" 
                                        id="repeatTenYears" 
                                        name="repeatTenYears" 
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <Label htmlFor="repeatTenYears" className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                                        <Repeat className="h-3 w-3" />
                                        Este feriado ocorre no mesmo dia todos os anos? (Criar para os próximos 10 anos)
                                    </Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Salvando...' : 'Salvar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters Bar */}
            <Card className="bg-slate-50/50">
                <CardContent className="p-4 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por evento..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="filter-start" className="text-xs font-medium">De:</Label>
                        <Input
                            id="filter-start"
                            type="date"
                            className="h-9 w-auto text-xs"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="filter-end" className="text-xs font-medium">Até:</Label>
                        <Input
                            id="filter-end"
                            type="date"
                            className="h-9 w-auto text-xs"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                        />
                    </div>
                    {(searchQuery || startDateFilter || endDateFilter) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-muted-foreground">
                            <X className="h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <CalendarIcon className="h-5 w-5 text-indigo-600" />
                        Listagem de Datas
                    </CardTitle>
                    <CardDescription>
                        Feriados e períodos de fechamento filtrados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('name')}>
                                        <div className="flex items-center">
                                            Evento
                                            {getSortIcon('name')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('start_date')}>
                                        <div className="flex items-center">
                                            Data
                                            {getSortIcon('start_date')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('is_national')}>
                                        <div className="flex items-center">
                                            Tipo
                                            {getSortIcon('is_national')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedHolidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarIcon className="h-8 w-8 opacity-20" />
                                                <p>Nenhum feriado encontrado para os filtros aplicados.</p>
                                                {(searchQuery || startDateFilter || endDateFilter) && (
                                                    <Button variant="link" size="sm" onClick={clearFilters}>Limpar filtros</Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedHolidays.map((holiday) => (
                                        <TableRow key={holiday.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">{holiday.name}</TableCell>
                                            <TableCell>
                                                {holiday.start_date === holiday.end_date
                                                    ? format(parseISO(holiday.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                                    : `${format(parseISO(holiday.start_date), "dd/MM/yy")} até ${format(parseISO(holiday.end_date), "dd/MM/yy")}`
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {holiday.is_national ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-normal">Nacional</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 font-normal">Regional/Clínica</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!holiday.is_national && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(holiday.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-indigo-900 shadow-sm">
                <Info className="h-5 w-5 mt-0.5 text-indigo-600 shrink-0" />
                <div className="space-y-1">
                    <p className="font-semibold">Regras de Bloqueio</p>
                    <p className="text-indigo-800/80 leading-relaxed">
                        Feriados nacionais são geridos pelo sistema. Você pode cadastrar feriados regionais ou períodos de fechamento (ex: férias coletivas) que impedirão novos agendamentos e pularão dias em planos recorrentes.
                    </p>
                </div>
            </div>
        </div>
    )
}
