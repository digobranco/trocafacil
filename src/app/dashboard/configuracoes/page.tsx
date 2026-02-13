import { createClient } from '@/utils/supabase/server'
import { Separator } from '@/components/ui/separator'
import { TenantForm } from './tenant-form'

import { checkRole } from '@/utils/roles'

export default async function SettingsPage() {
    await checkRole(['admin'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('id', user?.id)
        .single()

    const tenant = profile?.tenants

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configurações da Empresa</h3>
                <p className="text-sm text-muted-foreground">
                    Aqui você configura os dados que seus alunos verão. Ao criar uma empresa, você se torna o <strong>Administrador</strong> dela.
                </p>
            </div>
            <Separator />

            {tenant ? (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                    <h4 className="font-semibold text-blue-800">Sua organização está ativa</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Você está gerenciando: <strong>{tenant.name}</strong>
                    </p>
                </div>
            ) : (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
                    <h4 className="font-semibold text-yellow-800">Primeiros Passos</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                        Para começar a usar o sistema, primeiro configure os dados do seu negócio abaixo.
                    </p>
                </div>
            )}

            <TenantForm
                defaultName={tenant?.name}
                defaultSlug={tenant?.slug}
                defaultCancellationWindow={tenant?.cancellation_window_hours}
                defaultCreditValidity={tenant?.credit_validity_days}
                inviteCode={tenant?.invite_code}
                isActive={tenant?.is_active}
            />
        </div>
    )
}
