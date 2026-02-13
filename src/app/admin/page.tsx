import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Stats query
    const { count: tenantsCount } = await supabase.from('tenants').select('*', { count: 'exact', head: true })
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Empresas
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenantsCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Usuários
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersCount || 0}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
