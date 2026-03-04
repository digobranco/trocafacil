'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Settings, UserCog, Phone, Mail, Briefcase } from 'lucide-react'
import { ProfessionalDialog } from './professional-dialog'
import Link from 'next/link'
import { ViewToggle, useViewToggle } from '@/components/ui/view-toggle'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

interface ProfessionalListProps {
    professionals: any[]
}

export function ProfessionalList({ professionals }: ProfessionalListProps) {
    const { view, toggle } = useViewToggle('profissionais-view')

    if (!professionals?.length) {
        return (
            <EmptyState
                icon={UserCog}
                title="Sua lista de profissionais está vazia"
                description="Cadastre os fisioterapeutas, instrutores ou recepcionistas do seu espaço para começar."
                className="mt-4"
            >
                <ProfessionalDialog
                    trigger={
                        <Button size="lg" className="px-8 shadow-md">
                            Cadastrar Meu Primeiro Profissional
                        </Button>
                    }
                />
            </EmptyState>
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
                                <TableHead>Especialidade</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {professionals.map((professional) => (
                                <TableRow key={professional.id} className={!professional.active ? 'opacity-60' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <UserCog className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{professional.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{professional.specialty || '—'}</TableCell>
                                    <TableCell className="text-sm">{professional.phone || '—'}</TableCell>
                                    <TableCell className="text-sm truncate max-w-[180px]">{professional.email || '—'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={professional.active ? 'default' : 'secondary'}
                                            className={professional.active
                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                            }
                                        >
                                            {professional.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link href={`/dashboard/profissionais/${professional.id}/servicos`}>
                                                <Button variant="outline" size="sm">
                                                    <Settings className="mr-1 h-3 w-3" /> Serviços
                                                </Button>
                                            </Link>
                                            <ProfessionalDialog
                                                professional={professional}
                                                trigger={
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="mr-1 h-3 w-3" /> Editar
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : null}

            {/* Card View — always on mobile, toggle on desktop */}
            <div className={view === 'list' ? 'md:hidden' : ''}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {professionals.map((professional) => (
                        <Card key={professional.id} className={!professional.active ? 'opacity-60' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserCog className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">{professional.name}</CardTitle>
                                    </div>
                                    <Badge variant={professional.active ? 'default' : 'secondary'}
                                        className={professional.active
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                        }
                                    >
                                        {professional.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5 text-sm">
                                    {professional.specialty && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Briefcase className="h-3.5 w-3.5" /> Especialidade:
                                            </span>
                                            <span className="font-medium">{professional.specialty}</span>
                                        </div>
                                    )}
                                    {professional.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" /> Telefone:
                                            </span>
                                            <span className="font-medium">{professional.phone}</span>
                                        </div>
                                    )}
                                    {professional.email && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" /> Email:
                                            </span>
                                            <span className="font-medium truncate max-w-[180px]">{professional.email}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Link href={`/dashboard/profissionais/${professional.id}/servicos`}>
                                        <Button variant="outline" size="sm">
                                            <Settings className="mr-1 h-3 w-3" /> Serviços
                                        </Button>
                                    </Link>
                                    <ProfessionalDialog
                                        professional={professional}
                                        trigger={
                                            <Button variant="outline" size="sm">
                                                <Pencil className="mr-1 h-3 w-3" /> Editar
                                            </Button>
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
