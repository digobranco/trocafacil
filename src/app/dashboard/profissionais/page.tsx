import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ProfessionalDialog } from './professional-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Settings } from 'lucide-react'
import { checkRole } from '@/utils/roles'
import Link from 'next/link'

export default async function ProfessionalsPage() {
    await checkRole(['admin']) // Only admins organize the team initially

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    const { data: professionals } = await supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium"> / Profissionais</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os fisioterapeutas, personal trainers e instrutores.
                    </p>
                </div>
                <ProfessionalDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Especialidade</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {professionals?.map((professional) => (
                            <TableRow key={professional.id}>
                                <TableCell className="font-medium">{professional.name}</TableCell>
                                <TableCell>{professional.specialty || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{professional.phone || '-'}</span>
                                        <span className="text-muted-foreground text-xs">{professional.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={professional.active ? 'default' : 'secondary'}>
                                        {professional.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/profissionais/${professional.id}/servicos`}>
                                            <Button variant="ghost" size="sm">
                                                <Settings className="h-3 w-3 mr-1" /> Serviços
                                            </Button>
                                        </Link>
                                        <ProfessionalDialog
                                            professional={professional}
                                            trigger={
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-3 w-3 mr-1" /> Editar
                                                </Button>
                                            }
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!professionals?.length && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nenhum profissional cadastrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
