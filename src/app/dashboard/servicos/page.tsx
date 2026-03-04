import { createClient } from '@/utils/supabase/server'
import { ServiceDialog } from './service-dialog'
import { checkRole } from '@/utils/roles'
import { ServiceList } from './service-list'

export default async function ServicesPage() {
    const roleData = await checkRole(['admin', 'professional'])
    const supabase = await createClient()

    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', roleData?.tenant_id)
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

            <ServiceList services={services || []} />
        </div>
    )
}
