import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { ImpersonateButton } from './impersonate-button'

export default async function AdminTenantsPage() {
    const supabase = await createClient()
    const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Empresas (Tenants)</h3>
                    <p className="text-muted-foreground">
                        Gerencie todas as organizações cadastradas no sistema.
                    </p>
                </div>
                <Link href="/admin/tenants/new">
                    <Button>Nova Empresa</Button>
                </Link>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants?.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell>{tenant.slug}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{tenant.plan}</Badge>
                                </TableCell>
                                <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <ImpersonateButton tenantId={tenant.id} />
                                    <Link href={`/admin/tenants/${tenant.id}`}>
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!tenants?.length && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nenhuma empresa cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
