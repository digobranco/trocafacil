import { createClient } from '@/utils/supabase/server'
import { ProfessionalDialog } from './professional-dialog'
import { checkRole } from '@/utils/roles'
import { ProfessionalList } from './professional-list'

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
            <ProfessionalList professionals={professionals || []} />
        </div>
    )
}
