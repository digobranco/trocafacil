import { createClient } from '@/utils/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, Globe, Zap, ShieldCheck } from 'lucide-react'
import { checkRole } from '@/utils/roles'
import { TenantForm } from '../configuracoes/tenant-form'

export default async function EmpresaPage() {
    const roleData = await checkRole(['admin'])
    const supabase = await createClient()

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', roleData?.tenant_id)
        .single()

    if (!tenant) {
        return (
            <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-bold">Nenhuma empresa vinculada</h2>
                <p className="text-muted-foreground mt-2">Você precisa configurar sua empresa primeiro nas configurações.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building className="h-6 w-6 text-indigo-500" />
                        Perfil da Empresa
                    </h3>
                    <p className="text-sm text-muted-foreground italic">
                        Identidade corporativa e configurações de agendamento.
                    </p>
                </div>
                <Badge variant={tenant.is_active ? "default" : "secondary"} className={tenant.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {tenant.is_active ? "Empresa Ativa" : "Pausada"}
                </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" />
                                Dados Principais
                            </CardTitle>
                            <CardDescription>
                                Essas informações definem como os clientes veem sua marca.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TenantForm
                                defaultName={tenant.name}
                                defaultSlug={tenant.slug}
                                defaultCancellationWindow={tenant.cancellation_window_hours}
                                defaultCreditValidity={tenant.credit_validity_days}
                                inviteCode={tenant.invite_code}
                                isActive={tenant.is_active}
                                defaultLogoUrl={tenant.logo_url}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-700">
                                <Globe className="h-4 w-4" />
                                Presença Digital
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Seu link oficial</p>
                                <p className="text-sm font-medium text-slate-700 truncate">trocafacil.com/{tenant.slug}</p>
                            </div>
                            <Separator className="bg-indigo-100" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Status do Plano</p>
                                <Badge className="bg-indigo-600 capitalize">{tenant.plan || 'Free'}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Apenas usuários com papel de **Administrador** podem alterar as configurações fundamentais da empresa.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
