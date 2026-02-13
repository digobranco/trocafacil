import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserActions } from './user-actions'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: users } = await supabase
        .from('profiles')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false })

    const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name')

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Usuários</h3>
                <p className="text-muted-foreground">
                    Gerencie os usuários e seus vínculos com as empresas.
                </p>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome / Email</TableHead>
                            <TableHead>Papel Atual</TableHead>
                            <TableHead>Empresa Vinculada</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        user.role === 'super_admin' ? 'destructive' :
                                            user.role === 'admin' ? 'default' : 'secondary'
                                    }>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.tenants?.name || '-'}
                                </TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <UserActions user={user} tenants={tenants || []} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
