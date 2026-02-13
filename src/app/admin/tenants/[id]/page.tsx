import { createClient } from '@/utils/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Building, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TenantProfileForm } from '../tenant-profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'

export default async function TenantDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single()

    if (!tenant) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tenants">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building className="h-6 w-6 text-indigo-500" />
                            Gerenciar Empresa: {tenant.name}
                        </h3>
                        <p className="text-sm text-muted-foreground italic">
                            Acesso reservado ao Super Administrador.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações de Identidade</CardTitle>
                            <CardDescription>
                                Altere dados sensíveis como slug e plano diretamente no banco de dados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TenantProfileForm tenant={tenant} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-red-100 bg-red-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
                                <ShieldAlert className="h-4 w-4" />
                                Zona de Risco
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-red-600 leading-relaxed mb-4">
                                Alterações aqui impactam diretamente o acesso de todos os usuários vinculados a esta empresa.
                            </p>
                            <Button variant="destructive" size="sm" className="w-full" disabled>
                                Pausar Tenant (Em Breve)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Resumo técnico</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">ID do Tenant:</span>
                                <span className="font-mono">{tenant.id.split('-')[0]}...</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Data de Criação:</span>
                                <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
