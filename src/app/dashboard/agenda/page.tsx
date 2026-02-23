'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Settings, CalendarDays, LayoutGrid, User, Search, Loader2 } from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentDialog } from './appointment-dialog'
import { DayView } from './day-view'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import { getAgendaPageData, getUserCredits } from './actions'

type ViewMode = 'day' | 'week' | 'month'

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [refreshKey, setRefreshKey] = useState(0)
    const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])
    const [selectedProfessional, setSelectedProfessional] = useState<string>('all')
    const [profile, setProfile] = useState<any>(null)
    const [credits, setCredits] = useState<number>(0)
    const [onlyMyAgenda, setOnlyMyAgenda] = useState(false)

    // Search state: only show results after clicking Buscar
    const [hasSearched, setHasSearched] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchedProfessional, setSearchedProfessional] = useState<string>('all')
    const [searchedMyAgenda, setSearchedMyAgenda] = useState(false)
    const [searchKey, setSearchKey] = useState(0)

    useEffect(() => {
        loadInitialData()
    }, [])

    async function loadInitialData() {
        const data = await getAgendaPageData(format(currentDate, 'yyyy-MM-dd'))
        setProfessionals(data.professionals)
        setProfile(data.user)
        setCredits(data.credits)
    }

    const handleSearch = useCallback(() => {
        setSearchLoading(true)
        setSearchedProfessional(selectedProfessional)
        setSearchedMyAgenda(onlyMyAgenda)
        setSearchKey(prev => prev + 1)
        setHasSearched(true)
        // Loading will be managed by the child views
        setTimeout(() => setSearchLoading(false), 300)
    }, [selectedProfessional, onlyMyAgenda])

    const handleRefresh = useCallback(async () => {
        setSearchKey(prev => prev + 1)
        const creditData = await getUserCredits()
        setCredits(creditData)
    }, [])

    const navigate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') {
            setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1))
        } else if (viewMode === 'week') {
            setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
        } else {
            setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
        }
    }

    const goToToday = () => setCurrentDate(new Date())

    const getTitle = () => {
        if (viewMode === 'day') {
            return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
        } else if (viewMode === 'week') {
            return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
        } else {
            return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
        }
    }

    const handleSelectDay = (date: Date) => {
        setCurrentDate(date)
        setViewMode('day')
    }

    // The professionalId to pass to views: use the SEARCHED values, not the dropdown
    const activeProfId = searchedMyAgenda ? undefined : (searchedProfessional === 'all' ? '' : searchedProfessional)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Agenda</h3>
                    <p className="text-muted-foreground">
                        Gerencie os agendamentos.
                    </p>
                </div>
                <div className="flex gap-2">
                    {profile?.role !== 'customer' && (
                        <Link href="/dashboard/agenda/disponibilidade">
                            <Button variant="outline">
                                <Settings className="mr-2 h-4 w-4" />
                                Disponibilidade
                            </Button>
                        </Link>
                    )}
                    <AppointmentDialog
                        selectedDate={currentDate}
                        defaultProfessionalId={searchedProfessional === 'all' ? '' : searchedProfessional}
                        onSuccess={handleRefresh}
                        disabled={profile?.role === 'customer' && credits <= 0}
                        trigger={
                            <Button disabled={profile?.role === 'customer' && credits <= 0}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {profile?.role === 'customer' && credits <= 0 ? 'Créditos Insuficientes' : 'Novo Agendamento'}
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Navigation & View Toggle */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-medium capitalize">
                        {getTitle()}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter Tabs: Geral vs Minha Agenda */}
                    <Tabs value={onlyMyAgenda ? 'mine' : 'all'} onValueChange={(v) => setOnlyMyAgenda(v === 'mine')}>
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="all" className="text-xs">Empresa</TabsTrigger>
                            <TabsTrigger value="mine" className="text-xs">Minha Agenda</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {!onlyMyAgenda && (
                        <>
                            <div className="h-8 w-px bg-slate-200" />

                            {/* Professional Filter */}
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {professionals.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* Search Button */}
                    <Button onClick={handleSearch} disabled={searchLoading} className="gap-2">
                        {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Buscar
                    </Button>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                        <TabsList>
                            <TabsTrigger value="day" className="text-xs">
                                <CalendarDays className="h-4 w-4 mr-1" />
                                Dia
                            </TabsTrigger>
                            <TabsTrigger value="week" className="text-xs">
                                <LayoutGrid className="h-4 w-4 mr-1" />
                                Semana
                            </TabsTrigger>
                            <TabsTrigger value="month" className="text-xs">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Mês
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* View Content */}
            <div className="bg-white p-4 rounded-lg border shadow-sm min-h-[400px]">
                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Search className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm">Selecione os filtros e clique em <strong>Buscar</strong> para ver os agendamentos.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'day' && (
                            <DayView
                                key={`day-${searchKey}`}
                                currentDate={currentDate}
                                onRefresh={handleRefresh}
                                professionalId={activeProfId}
                                onlyMyAgenda={searchedMyAgenda}
                            />
                        )}
                        {viewMode === 'week' && (
                            <WeekView
                                key={`week-${searchKey}`}
                                currentDate={currentDate}
                                onSelectDay={handleSelectDay}
                                professionalId={activeProfId}
                                onlyMyAgenda={searchedMyAgenda}
                            />
                        )}
                        {viewMode === 'month' && (
                            <MonthView
                                key={`month-${searchKey}`}
                                currentDate={currentDate}
                                onSelectDay={handleSelectDay}
                                professionalId={activeProfId}
                                onlyMyAgenda={searchedMyAgenda}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
