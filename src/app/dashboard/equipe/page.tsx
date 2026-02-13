import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RoleSwitcher } from './role-switcher'
import { checkRole } from '@/utils/roles'

export default async function EquipePage() {
    await checkRole(['admin'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', adminProfile?.tenant_id)
        .order('full_name', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gestão de Usuários (Equipe)</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie quem faz parte da sua empresa e defina suas permissões.
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Papel Atual</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members?.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.full_name || 'Sem nome'}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        member.role === 'admin' ? 'default' :
                                            member.role === 'professional' ? 'secondary' : 'outline'
                                    }>
                                        {member.role === 'admin' ? 'Administrador' :
                                            member.role === 'professional' ? 'Profissional' : 'Cliente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.id !== user.id ? (
                                        <RoleSwitcher userId={member.id} currentRole={member.role} />
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Você (Admin)</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
