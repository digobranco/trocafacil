import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserCredits } from './agenda/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    CreditCard,
    History,
    Users,
    CalendarCheck,
    TrendingUp,
    Award,
    UserPlus,
    Coins,
    CalendarRange,
    Clock,
} from 'lucide-react'
import { CreditHistory } from './clientes/credit-history'
import { getDashboardStats, getAvailableSlots } from './dashboard-actions'
import { DashboardFiltered } from './dashboard-filtered'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        redirect('/dashboard/onboarding')
    }

    // Customer view
    if (profile.role === 'customer') {
        const credits = await getUserCredits()
        const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
        const customerId = customerData?.id

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
                    <p className="text-muted-foreground">Bem-vindo de volta ao TrocaFácil.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Meus Créditos</CardTitle>
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-700">{credits}</div>
                            <p className="text-xs text-indigo-600/70 mt-1">Disponíveis para novos agendamentos</p>
                        </CardContent>
                    </Card>
                </div>
                {customerId && (
                    <Card className="md:col-span-2 lg:col-span-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500" />
                                Meu Histórico de Créditos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreditHistory customerId={customerId} />
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    }

    // Admin / Professional view
    const [stats, availableSlots] = await Promise.all([
        getDashboardStats(),
        getAvailableSlots(),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
                <p className="text-muted-foreground">
                    Visão geral do seu espaço — {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}.
                </p>
            </div>

            {/* KPI Cards - Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Agendamentos Hoje</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-800">{stats?.todayAppointments || 0}</div>
                        <p className="text-xs text-blue-600/70 mt-1">sessões agendadas para hoje</p>
                    </CardContent>
                </Card>

                <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700">Agendamentos da Semana</CardTitle>
                        <CalendarRange className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-800">{stats?.weekTotal || 0}</div>
                        {/* Mini bar chart */}
                        <div className="flex items-end gap-1 mt-2 h-6">
                            {stats?.weeklyChart?.map((day, i) => {
                                const maxCount = Math.max(...(stats.weeklyChart?.map(d => d.count) || [1]), 1)
                                const heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 15) : 5
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                        <div
                                            className={`w-full rounded-sm transition-all ${day.count > 0 ? 'bg-indigo-400' : 'bg-slate-200'}`}
                                            style={{ height: `${heightPct}%` }}
                                            title={`${day.label}: ${day.count}`}
                                        />
                                        <span className="text-[10px] text-muted-foreground">{day.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Taxa de Presença</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-800">{stats?.attendanceRate || 0}%</div>
                        <p className="text-xs text-green-600/70 mt-1">nos últimos 30 dias</p>
                    </CardContent>
                </Card>

                <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Planos Ativos</CardTitle>
                        <Award className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-800">{stats?.activePlans || 0}</div>
                        <p className="text-xs text-purple-600/70 mt-1">clientes com plano ativo</p>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Cards - Row 2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">Total Clientes</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-800">{stats?.totalClients || 0}</div>
                        <p className="text-xs text-amber-600/70 mt-1">cadastrados no sistema</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700">Novos Clientes</CardTitle>
                        <UserPlus className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-800">{stats?.newClientsMonth || 0}</div>
                        <p className="text-xs text-emerald-600/70 mt-1">cadastrados este mês</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Créditos em Circulação</CardTitle>
                        <Coins className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-800">{stats?.totalCredits || 0}</div>
                        <p className="text-xs text-orange-600/70 mt-1">disponíveis entre todos os clientes</p>
                    </CardContent>
                </Card>

                {/* Available Slots */}
                <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-teal-700">Horários Vagos</CardTitle>
                        <Clock className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-teal-800">{availableSlots.length}</div>
                        <p className="text-xs text-teal-600/70 mt-1">slots disponíveis hoje/amanhã</p>
                    </CardContent>
                </Card>
            </div>

            {/* Available Slots Detail */}
            {availableSlots.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-teal-500" />
                            Próximos Horários Vagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {availableSlots.map((slot, i) => {
                                const slotDate = new Date(slot.date + 'T12:00:00')
                                const isToday = slot.date === format(new Date(), 'yyyy-MM-dd')
                                return (
                                    <div key={i} className="p-3 rounded-lg bg-teal-50/50 border border-teal-100 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {isToday ? 'Hoje' : format(slotDate, "EEE, dd/MM", { locale: ptBR })}
                                        </p>
                                        <p className="text-lg font-bold text-teal-700">{slot.time}</p>
                                        <p className="text-xs text-muted-foreground">{slot.professionalName}</p>
                                        <Badge variant="outline" className="mt-1 text-teal-600 border-teal-200 text-[10px]">
                                            {slot.available} {slot.available === 1 ? 'vaga' : 'vagas'}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filtered Section: Appointments + Occupancy */}
            <DashboardFiltered />
        </div>
    )
}
