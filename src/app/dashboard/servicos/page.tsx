import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ServiceDialog } from './service-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

import { checkRole } from '@/utils/roles'

export default async function ServicesPage() {
    await checkRole(['admin', 'professional'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Serviços</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie as modalidades oferecidas (Pilates, Personal, etc).
                    </p>
                </div>
                <ServiceDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services?.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.duration_minutes} min</TableCell>
                                <TableCell>
                                    {service.price ? `R$ ${service.price}` : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={service.active ? 'default' : 'secondary'} className={service.active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-3" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 px-3"}>
                                        {service.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ServiceDialog
                                        service={service}
                                        trigger={
                                            <Button variant="ghost" size="sm">
                                                <Pencil className="h-3 w-3 mr-1" /> Editar
                                            </Button>
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!services?.length && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nenhum serviço cadastrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
