'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleSwitcher } from './role-switcher'
import { Users, Mail, Shield } from 'lucide-react'
import { ViewToggle, useViewToggle } from '@/components/ui/view-toggle'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface TeamListProps {
    members: any[]
    currentUserId: string
}

function getRoleBadge(role: string) {
    switch (role) {
        case 'admin':
            return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">Administrador</Badge>
        case 'professional':
            return <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50">Profissional</Badge>
        default:
            return <Badge variant="outline">Cliente</Badge>
    }
}

export function TeamList({ members, currentUserId }: TeamListProps) {
    const { view, toggle } = useViewToggle('equipe-view')

    if (!members?.length) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h4>
                    <p className="text-muted-foreground">Os membros da sua equipe aparecerão aqui.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <ViewToggle view={view} onToggle={toggle} />
            </div>

            {/* List View — desktop only */}
            {view === 'list' ? (
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Papel</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => {
                                const isCurrentUser = member.id === currentUserId
                                return (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-primary" />
                                                <span className="font-medium">
                                                    {member.full_name || 'Sem nome'}
                                                    {isCurrentUser && <span className="text-xs text-muted-foreground font-normal ml-2">(Você)</span>}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{member.email}</TableCell>
                                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                                        <TableCell className="text-right">
                                            {!isCurrentUser ? (
                                                <RoleSwitcher userId={member.id} currentRole={member.role} />
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : null}

            {/* Card View — always on mobile, toggle on desktop */}
            <div className={view === 'list' ? 'md:hidden' : ''}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => {
                        const isCurrentUser = member.id === currentUserId
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
            </div>
        </div>
    )
}
