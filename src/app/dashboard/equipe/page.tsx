import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleSwitcher } from './role-switcher'
import { checkRole } from '@/utils/roles'
import { Users, Mail, Shield } from 'lucide-react'

export default async function EquipePage() {
    const roleData = await checkRole(['admin'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', roleData?.tenant_id)
        .order('full_name', { ascending: true })

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">Administrador</Badge>
            case 'professional':
                return <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50">Profissional</Badge>
            default:
                return <Badge variant="outline">Cliente</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gestão de Usuários (Equipe)</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie quem faz parte da sua empresa e defina suas permissões.
                </p>
            </div>

            {!members?.length ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h4>
                        <p className="text-muted-foreground">
                            Os membros da sua equipe aparecerão aqui.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => {
                        const isCurrentUser = member.id === user.id

                        return (
                            <Card key={member.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg">
                                                {member.full_name || 'Sem nome'}
                                                {isCurrentUser && (
                                                    <span className="text-xs text-muted-foreground font-normal ml-2">(Você)</span>
                                                )}
                                            </CardTitle>
                                        </div>
                                        {getRoleBadge(member.role)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" /> Email:
                                            </span>
                                            <span className="font-medium truncate max-w-[180px]">{member.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Shield className="h-3.5 w-3.5" /> Papel:
                                            </span>
                                            {getRoleBadge(member.role)}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        {!isCurrentUser ? (
                                            <RoleSwitcher userId={member.id} currentRole={member.role} />
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Você não pode alterar seu próprio papel</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

