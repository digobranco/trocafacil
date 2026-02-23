import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CustomerDialog } from './new-customer-dialog'
import { Badge } from '@/components/ui/badge'
import { checkRole } from '@/utils/roles'
import { CustomerTable } from './customer-table'

export default async function CustomersPage() {
    await checkRole(['admin', 'professional'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    const { data: customers } = await supabase
        .from('customers')
        .select('*, credits(quantity), client_memberships(id, status, membership_plans(name))')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Clientes</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie sua base de alunos e pacientes, acompanhe créditos e histórico.
                    </p>
                </div>
                <CustomerDialog />
            </div>

            <CustomerTable initialCustomers={customers || []} />
        </div>
    )
}
