import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserCredits } from './agenda/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
import { getDashboardStats, getAvailableSlots, getOnboardingProgress, getNextAppointment } from './dashboard-actions'
import { getActiveClientMemberships } from './planos/actions'
import { DashboardFiltered } from './dashboard-filtered'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getPlanTypeLabel } from './planos/utils'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role, full_name, created_at')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        // Fallback safety check: Maybe the trigger finished but the data is not indexed yet
        // or there's a slight delay. We can check the auth metadata as a hint.
        const inviteCode = user.user_metadata?.invite_code
        if (inviteCode) {
            // Try to find tenant by this code and update profile manually
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('invite_code', inviteCode)
                .single()

            if (tenant) {
                // Manually update the profile to fix the delay
                await supabase
                    .from('profiles')
                    .update({ tenant_id: tenant.id })
                    .eq('id', user.id)

                // Refresh the page data
                redirect('/dashboard')
            }
        }

        redirect('/dashboard/onboarding')
    }

    // Customer view
    if (profile.role === 'customer') {
        const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
        const customerId = customerData?.id

        const [creditsData, memberships, nextApt] = await Promise.all([
            getUserCredits(),
            customerId ? getActiveClientMemberships(customerId) : Promise.resolve([]),
            customerId ? getNextAppointment(customerId) : Promise.resolve(null)
        ])

        const totalCredits = creditsData.reduce((acc, c) => acc + c.quantity, 0)
        const primaryMembership = memberships[0]

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Olá, {profile.full_name?.split(' ')[0]}!</h2>
                        <p className="text-muted-foreground">
                            Bem-vindo de volta. Você é membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Credits Card */}
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Meus Créditos</CardTitle>
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-700">{totalCredits}</div>
                            <p className="text-xs text-indigo-600/70 mt-1">Créditos totais disponíveis</p>
                            <Link href="/dashboard/meus-creditos">
                                <Button variant="link" size="sm" className="px-0 h-auto mt-4 text-xs">
                                    <History className="h-3 w-3 mr-1" /> Ver histórico completo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Next Appointment Card */}
                    <Card className="border-emerald-100 bg-emerald-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Minha Próxima Aula</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            {nextApt ? (
                                <>
                                    <div className="text-lg font-bold text-emerald-700">
                                        {format(new Date(nextApt.startTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                    <p className="text-xs text-emerald-600/70 mt-1">
                                        {nextApt.serviceName} com {nextApt.professionalName}
                                    </p>
                                    <Link href="/dashboard/agenda">
                                        <Button size="sm" variant="outline" className="w-full mt-4 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                            Ver Agenda
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="text-lg font-bold text-gray-400">Sem agendamentos</div>
                                    <p className="text-xs text-gray-500 mt-1">Agende sua próxima sessão agora</p>
                                    <Link href="/dashboard/agenda">
                                        <Button size="sm" variant="default" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                                            Agendar Agora
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Memberships Card - Full Width */}
                <Card className="border-purple-100 bg-purple-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meus Planos Ativos</CardTitle>
                        <Award className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        {memberships.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {memberships.map((membership) => {
                                    const plan = membership.membership_plans
                                    if (!plan) return null
                                    return (
                                        <div key={membership.id} className="p-4 rounded-lg bg-white border border-purple-100 space-y-3 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-purple-900">{plan.name}</span>
                                                <Badge className="bg-purple-500 text-[9px] h-4">ATIVO</Badge>
                                            </div>
                                            <div className="text-xs text-purple-700 space-y-2 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-3.5 w-3.5 text-purple-400" />
                                                    {getPlanTypeLabel(plan.plan_type)}
                                                    {plan.plan_type === 'weekly_frequency' && (
                                                        <span> • {plan.weekly_frequency}x/semana</span>
                                                    )}
                                                </div>

                                                {membership.schedule_days && membership.schedule_days.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <CalendarRange className="h-3.5 w-3.5 text-purple-400" />
                                                        <div className="flex flex-wrap gap-1">
                                                            {membership.schedule_days.map(d => (
                                                                <span key={d} className="bg-purple-50 px-1 rounded">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]}</span>
                                                            ))}
                                                        </div>
                                                        {membership.schedule_time && <span className="ml-1">às {membership.schedule_time}</span>}
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-2">
                                                    <Users className="h-3.5 w-3.5 text-purple-400 mt-0.5" />
                                                    <span className="leading-tight">
                                                        {membership.services?.name || 'Serviço'} com <br />
                                                        <span className="text-purple-900">{membership.professionals?.name || 'Profissional'}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Award className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                <div className="text-lg font-bold text-slate-400">Nenhum plano ativo</div>
                                <p className="text-sm text-slate-500 mt-1">Fale com a recepção para assinar um plano e começar seus treinos.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Client Quick Actions or Info could go here */}
            </div>
        )
    }

    // Admin / Professional view
    const [stats, availableSlots, onboarding] = await Promise.all([
        getDashboardStats(),
        getAvailableSlots(),
        getOnboardingProgress(),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
                <p className="text-muted-foreground">
                    Visão geral do seu espaço — {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}.
                </p>
            </div>

            {onboarding && <OnboardingChecklist progress={onboarding} />}

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
