import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfessionalDialog } from './professional-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Settings, UserCog, Phone, Mail, Briefcase } from 'lucide-react'
import { checkRole } from '@/utils/roles'
import Link from 'next/link'

export default async function ProfessionalsPage() {
    const roleData = await checkRole(['admin'])

    const supabase = await createClient()

    const { data: professionals } = await supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', roleData?.tenant_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Profissionais</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os fisioterapeutas, personal trainers e instrutores.
                    </p>
                </div>
                <ProfessionalDialog />
            </div>

            {!professionals?.length ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">Nenhum profissional cadastrado</h4>
                        <p className="text-muted-foreground mb-4">
                            Adicione seu primeiro profissional para começar.
                        </p>
                        <ProfessionalDialog />
                    </CardContent>
                </Card>
            ) : (
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
            )}
        </div>
    )
}

