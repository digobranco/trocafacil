import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserCredits } from './agenda/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CreditCard, History } from 'lucide-react'
import { CreditHistory } from './clientes/credit-history'

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

    let customerId = null
    const credits = profile.role === 'customer' ? await getUserCredits() : null

    if (profile.role === 'customer') {
        const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
        customerId = customerData?.id
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
                <p className="text-muted-foreground">Bem-vindo de volta ao TrocaFácil.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {profile.role === 'customer' && (
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
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Sessões marcadas para esta semana</p>
                    </CardContent>
                </Card>

                {profile.role === 'customer' && customerId && (
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
        </div>
    )
}
