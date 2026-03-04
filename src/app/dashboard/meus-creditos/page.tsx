import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CreditHistory } from '../clientes/credit-history'

export default async function MyCreditsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'customer') {
        redirect('/dashboard')
    }

    const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

    const customerId = customerData?.id

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Meu Histórico de Créditos</h2>
                    <p className="text-muted-foreground">Veja todas as suas entradas e saídas de créditos.</p>
                </div>
            </div>

            {customerId ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-500" />
                            Transações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreditHistory customerId={customerId} />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        Não foi possível carregar seu perfil de cliente.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
