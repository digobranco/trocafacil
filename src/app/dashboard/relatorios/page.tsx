'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    BarChart3,
    Download,
    Loader2,
    Calendar,
    Users,
    TrendingUp,
    Search,
    DollarSign,
    UserX,
    Coins,
    Award,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    getAppointmentsReport,
    getFrequencyReport,
    getOccupancyReport,
    getRevenueReport,
    getAbsenceReport,
    getCreditsReport,
    getActivePlansReport,
    getProfessionalsForFilter,
    type ReportFilters,
} from './actions'

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Presente',
    absent: 'Falta',
    cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    absent: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
}

const CREDIT_TYPE_LABELS: Record<string, string> = {
    usage: 'Uso',
    addition: 'Adição',
    cancellation_refund: 'Estorno',
    manual_adjustment: 'Ajuste Manual',
}

function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(false)
    const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])
    const [activeTab, setActiveTab] = useState('appointments')
    const [hasSearched, setHasSearched] = useState(false)

    // Filters
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [professionalId, setProfessionalId] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // Data
    const [appointmentsData, setAppointmentsData] = useState<any>(null)
    const [frequencyData, setFrequencyData] = useState<any[]>([])
    const [occupancyData, setOccupancyData] = useState<any[]>([])
    const [revenueData, setRevenueData] = useState<any>(null)
    const [absenceData, setAbsenceData] = useState<any[]>([])
    const [creditsData, setCreditsData] = useState<any[]>([])
    const [plansData, setPlansData] = useState<any>(null)

    useEffect(() => {
        loadProfessionals()
    }, [])

    async function loadProfessionals() {
        const data = await getProfessionalsForFilter()
        setProfessionals(data)
    }

    async function handleSearch() {
        setLoading(true)
        setHasSearched(true)
        const filters: ReportFilters = {
            startDate,
            endDate,
            professionalId: professionalId && professionalId !== 'all' ? professionalId : undefined,
            status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        }

        try {
            switch (activeTab) {
                case 'appointments':
                    setAppointmentsData(await getAppointmentsReport(filters))
                    break
                case 'frequency':
                    setFrequencyData(await getFrequencyReport(filters))
                    break
                case 'occupancy':
                    setOccupancyData(await getOccupancyReport(filters))
                    break
                case 'revenue':
                    setRevenueData(await getRevenueReport(filters))
                    break
                case 'absence':
                    setAbsenceData(await getAbsenceReport(filters))
                    break
                case 'credits':
                    setCreditsData(await getCreditsReport(filters))
                    break
                case 'plans':
                    setPlansData(await getActivePlansReport(filters))
                    break
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Export functions
    function handleExportAppointments() {
        if (!appointmentsData?.data) return
        const headers = ['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Status']
        const rows = appointmentsData.data.map((r: any) => [
            format(new Date(r.date), 'dd/MM/yyyy'),
            format(new Date(r.startTime), 'HH:mm'),
            r.clientName, r.professionalName, r.serviceName,
            STATUS_LABELS[r.status] || r.status,
        ])
        downloadCSV([headers, ...rows], `agendamentos_${startDate}_${endDate}.csv`)
    }

    function handleExportFrequency() {
        if (!frequencyData.length) return
        const headers = ['Cliente', 'Presentes', 'Faltas', 'Total', 'Taxa (%)']
        const rows = frequencyData.map((r: any) => [r.clientName, String(r.completed), String(r.absent), String(r.total), String(r.attendanceRate)])
        downloadCSV([headers, ...rows], `frequencia_${startDate}_${endDate}.csv`)
    }

    function handleExportOccupancy() {
        if (!occupancyData.length) return
        const headers = ['Profissional', 'Agendados', 'Capacidade', 'Ocupação (%)']
        const rows = occupancyData.map((r: any) => [r.name, String(r.booked), String(r.capacity), String(r.percentage)])
        downloadCSV([headers, ...rows], `ocupacao_${startDate}_${endDate}.csv`)
    }

    function handleExportRevenue() {
        if (!revenueData?.plans) return
        const headers = ['Cliente', 'Plano', 'Tipo', 'Valor (R$)']
        const rows = revenueData.plans.map((r: any) => [r.clientName, r.planName, r.planType, String(r.price)])
        downloadCSV([headers, ...rows], `faturamento.csv`)
    }

    function handleExportAbsence() {
        if (!absenceData.length) return
        const headers = ['Cliente', 'Telefone', 'Faltas', 'Total', 'Taxa Falta (%)', 'Última Falta']
        const rows = absenceData.map((r: any) => [
            r.clientName, r.phone, String(r.absent), String(r.total), String(r.absenceRate),
            r.lastAbsence ? format(new Date(r.lastAbsence), 'dd/MM/yyyy') : '-',
        ])
        downloadCSV([headers, ...rows], `faltas_${startDate}_${endDate}.csv`)
    }

    function handleExportCredits() {
        if (!creditsData.length) return
        const headers = ['Data', 'Cliente', 'Tipo', 'Quantidade', 'Observação']
        const rows = creditsData.map((r: any) => [
            format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm'),
            r.clientName, CREDIT_TYPE_LABELS[r.type] || r.type,
            String(r.quantityChange), r.notes || '-',
        ])
        downloadCSV([headers, ...rows], `creditos_${startDate}_${endDate}.csv`)
    }

    function handleExportPlans() {
        if (!plansData?.details) return
        const headers = ['Cliente', 'Plano', 'Tipo', 'Data Início']
        const rows = plansData.details.map((r: any) => [
            r.clientName, r.planName, r.planType,
            r.startDate ? format(new Date(r.startDate), 'dd/MM/yyyy') : '-',
        ])
        downloadCSV([headers, ...rows], `planos_ativos.csv`)
    }

    const emptyPlaceholder = (
        <div className="py-12 text-center text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-20" />
            {!hasSearched ? 'Use os filtros acima e clique em Buscar.' : 'Nenhum dado encontrado.'}
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Relatórios</h3>
                <p className="text-muted-foreground">Analise os dados do seu espaço por período.</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Data Início</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Data Fim</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Profissional</Label>
                            <Select value={professionalId} onValueChange={setProfessionalId}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {professionals.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                    <SelectItem value="completed">Presente</SelectItem>
                                    <SelectItem value="absent">Falta</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="appointments" className="gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5" /> Agendamentos
                    </TabsTrigger>
                    <TabsTrigger value="frequency" className="gap-1.5 text-xs">
                        <Users className="h-3.5 w-3.5" /> Frequência
                    </TabsTrigger>
                    <TabsTrigger value="occupancy" className="gap-1.5 text-xs">
                        <TrendingUp className="h-3.5 w-3.5" /> Ocupação
                    </TabsTrigger>
                    <TabsTrigger value="revenue" className="gap-1.5 text-xs">
                        <DollarSign className="h-3.5 w-3.5" /> Faturamento
                    </TabsTrigger>
                    <TabsTrigger value="absence" className="gap-1.5 text-xs">
                        <UserX className="h-3.5 w-3.5" /> Faltas
                    </TabsTrigger>
                    <TabsTrigger value="credits" className="gap-1.5 text-xs">
                        <Coins className="h-3.5 w-3.5" /> Créditos
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="gap-1.5 text-xs">
                        <Award className="h-3.5 w-3.5" /> Planos
                    </TabsTrigger>
                </TabsList>

                {/* ==================== APPOINTMENTS ==================== */}
                <TabsContent value="appointments">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Agendamentos por Período</CardTitle>
                            {appointmentsData?.data?.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportAppointments} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!appointmentsData ? emptyPlaceholder : appointmentsData.data.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum agendamento encontrado.</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                        {[
                                            { label: 'Total', value: appointmentsData.totals.total, bg: 'bg-slate-50', text: '' },
                                            { label: 'Agendados', value: appointmentsData.totals.scheduled, bg: 'bg-blue-50', text: 'text-blue-700' },
                                            { label: 'Presentes', value: appointmentsData.totals.completed, bg: 'bg-green-50', text: 'text-green-700' },
                                            { label: 'Faltas', value: appointmentsData.totals.absent, bg: 'bg-red-50', text: 'text-red-700' },
                                            { label: 'Cancelados', value: appointmentsData.totals.cancelled, bg: 'bg-slate-50', text: 'text-slate-700' },
                                        ].map(s => (
                                            <div key={s.label} className={`p-3 rounded-lg ${s.bg} text-center`}>
                                                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Horário</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Profissional</TableHead>
                                                    <TableHead>Serviço</TableHead>
                                                    <TableHead className="text-center">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {appointmentsData.data.map((row: any) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="whitespace-nowrap">{format(new Date(row.date), 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell>{format(new Date(row.startTime), 'HH:mm')}</TableCell>
                                                        <TableCell className="font-medium">{row.clientName}</TableCell>
                                                        <TableCell>{row.professionalName}</TableCell>
                                                        <TableCell>{row.serviceName}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className={STATUS_COLORS[row.status] || ''}>{STATUS_LABELS[row.status] || row.status}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== FREQUENCY ==================== */}
                <TabsContent value="frequency">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Frequência por Cliente</CardTitle>
                            {frequencyData.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportFrequency} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {frequencyData.length === 0 ? emptyPlaceholder : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead className="text-center">Presenças</TableHead>
                                                <TableHead className="text-center">Faltas</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Taxa</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {frequencyData.map((row: any) => (
                                                <TableRow key={row.clientId}>
                                                    <TableCell className="font-medium">{row.clientName}</TableCell>
                                                    <TableCell className="text-center"><Badge className="bg-green-50 text-green-700 border-green-200">{row.completed}</Badge></TableCell>
                                                    <TableCell className="text-center"><Badge className="bg-red-50 text-red-700 border-red-200">{row.absent}</Badge></TableCell>
                                                    <TableCell className="text-center">{row.total}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`font-semibold ${row.attendanceRate >= 80 ? 'text-green-600' : row.attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {row.attendanceRate}%
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== OCCUPANCY ==================== */}
                <TabsContent value="occupancy">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Ocupação por Profissional</CardTitle>
                            {occupancyData.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportOccupancy} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {occupancyData.length === 0 ? emptyPlaceholder : (
                                <div className="space-y-5">
                                    {occupancyData.map((prof: any) => (
                                        <div key={prof.id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{prof.name}</span>
                                                <span className="text-muted-foreground">{prof.booked} / {prof.capacity} ({prof.percentage}%)</span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${prof.percentage >= 90 ? 'bg-red-500' : prof.percentage >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(prof.percentage, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== REVENUE ==================== */}
                <TabsContent value="revenue">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Faturamento Estimado</CardTitle>
                            {revenueData?.plans?.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportRevenue} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!revenueData ? emptyPlaceholder : revenueData.plans.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum plano ativo encontrado.</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                                            <p className="text-sm text-green-700 font-medium">Receita Mensal Estimada</p>
                                            <p className="text-3xl font-bold text-green-800 mt-1">{formatCurrency(revenueData.totalMonthly)}</p>
                                            <p className="text-xs text-green-600 mt-1">Baseado em {revenueData.plans.length} plano(s) ativo(s)</p>
                                        </div>
                                    </div>

                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Plano</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead className="text-right">Valor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {revenueData.plans.map((row: any) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">{row.clientName}</TableCell>
                                                        <TableCell>{row.planName}</TableCell>
                                                        <TableCell><Badge variant="outline">{row.planType}</Badge></TableCell>
                                                        <TableCell className="text-right font-semibold">{formatCurrency(row.price)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== ABSENCE ==================== */}
                <TabsContent value="absence">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Relatório de Faltas</CardTitle>
                            {absenceData.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportAbsence} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {absenceData.length === 0 ? emptyPlaceholder : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Telefone</TableHead>
                                                <TableHead className="text-center">Faltas</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Taxa Falta</TableHead>
                                                <TableHead>Última Falta</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {absenceData.map((row: any) => (
                                                <TableRow key={row.clientId}>
                                                    <TableCell className="font-medium">{row.clientName}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{row.phone}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className="bg-red-50 text-red-700 border-red-200">{row.absent}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">{row.total}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`font-semibold ${row.absenceRate >= 50 ? 'text-red-600' : row.absenceRate >= 25 ? 'text-amber-600' : 'text-green-600'}`}>
                                                            {row.absenceRate}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {row.lastAbsence ? format(new Date(row.lastAbsence), 'dd/MM/yyyy') : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== CREDITS ==================== */}
                <TabsContent value="credits">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Movimentação de Créditos</CardTitle>
                            {creditsData.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportCredits} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {creditsData.length === 0 ? emptyPlaceholder : (
                                <>
                                    {/* Credits summary */}
                                    {(() => {
                                        const added = creditsData.filter((c: any) => c.quantityChange > 0).reduce((s: number, c: any) => s + c.quantityChange, 0)
                                        const used = creditsData.filter((c: any) => c.quantityChange < 0).reduce((s: number, c: any) => s + Math.abs(c.quantityChange), 0)
                                        return (
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-3 rounded-lg bg-green-50 text-center">
                                                    <p className="text-2xl font-bold text-green-700">+{added}</p>
                                                    <p className="text-xs text-green-600">Entradas</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-red-50 text-center">
                                                    <p className="text-2xl font-bold text-red-700">-{used}</p>
                                                    <p className="text-xs text-red-600">Saídas</p>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead className="text-center">Quantidade</TableHead>
                                                    <TableHead>Observação</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {creditsData.map((row: any) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="whitespace-nowrap">{format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                        <TableCell className="font-medium">{row.clientName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{CREDIT_TYPE_LABELS[row.type] || row.type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`font-semibold ${row.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {row.quantityChange > 0 ? '+' : ''}{row.quantityChange}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{row.notes || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== ACTIVE PLANS ==================== */}
                <TabsContent value="plans">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg">Planos Ativos</CardTitle>
                            {plansData?.details?.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleExportPlans} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!plansData ? emptyPlaceholder : plansData.details.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum plano ativo encontrado.</div>
                            ) : (
                                <>
                                    {/* Distribution */}
                                    <div className="space-y-4 mb-6">
                                        <p className="text-sm font-medium text-muted-foreground">Distribuição por Plano ({plansData.details.length} clientes)</p>
                                        {plansData.distribution.map((plan: any) => (
                                            <div key={plan.planId} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{plan.planName} <Badge variant="outline" className="ml-1 text-[10px]">{plan.planType}</Badge></span>
                                                    <span className="text-muted-foreground">{plan.count} ({plan.percentage}%)</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${plan.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Plano</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Início</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {plansData.details.map((row: any) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">{row.clientName}</TableCell>
                                                        <TableCell>{row.planName}</TableCell>
                                                        <TableCell><Badge variant="outline">{row.planType}</Badge></TableCell>
                                                        <TableCell>{row.startDate ? format(new Date(row.startDate), 'dd/MM/yyyy') : '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
