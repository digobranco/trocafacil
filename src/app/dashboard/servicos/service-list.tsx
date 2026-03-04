'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Dumbbell, Clock, DollarSign } from 'lucide-react'
import { ServiceDialog } from './service-dialog'
import { ViewToggle, useViewToggle } from '@/components/ui/view-toggle'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface ServiceListProps {
    services: any[]
}

export function ServiceList({ services }: ServiceListProps) {
    const { view, toggle } = useViewToggle('servicos-view')

    if (!services?.length) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h4>
                    <p className="text-muted-foreground mb-4">Crie seu primeiro serviço para começar.</p>
                    <ServiceDialog />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <ViewToggle view={view} onToggle={toggle} />
            </div>

            {/* List View — only on desktop */}
            {view === 'list' ? (
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id} className={!service.active ? 'opacity-60' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Dumbbell className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{service.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{service.duration_minutes} min</TableCell>
                                    <TableCell>{service.price ? `R$ ${service.price}` : '—'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={service.active ? 'default' : 'secondary'}
                                            className={service.active
                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                            }
                                        >
                                            {service.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ServiceDialog
                                            service={service}
                                            trigger={
                                                <Button variant="outline" size="sm">
                                                    <Pencil className="mr-1 h-3 w-3" /> Editar
                                                </Button>
                                            }
                                        />
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
                    {services.map((service) => (
                        <Card key={service.id} className={!service.active ? 'opacity-60' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                    </div>
                                    <Badge
                                        variant={service.active ? 'default' : 'secondary'}
                                        className={service.active
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                        }
                                    >
                                        {service.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" /> Duração:
                                        </span>
                                        <span className="font-medium">{service.duration_minutes} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5" /> Preço:
                                        </span>
                                        <span className="font-medium">
                                            {service.price ? `R$ ${service.price}` : '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <ServiceDialog
                                        service={service}
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
