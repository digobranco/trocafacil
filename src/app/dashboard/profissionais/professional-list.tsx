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

interface ProfessionalListProps {
    professionals: any[]
}

export function ProfessionalList({ professionals }: ProfessionalListProps) {
    const { view, toggle } = useViewToggle('profissionais-view')

    if (!professionals?.length) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Nenhum profissional cadastrado</h4>
                    <p className="text-muted-foreground mb-4">Adicione seu primeiro profissional para começar.</p>
                    <ProfessionalDialog />
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
