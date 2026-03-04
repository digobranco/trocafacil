import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { TeamList } from './team-list'
import { InviteCodeCard } from '@/components/dashboard/invite-code-card'
import { getProfessionalInviteCode } from '../actions'

export default async function EquipePage() {
    const roleData = await checkRole(['admin'])
    const inviteData = await getProfessionalInviteCode()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', roleData?.tenant_id)
        .order('full_name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Gestão de Usuários (Equipe)</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie quem faz parte da sua empresa e defina suas permissões.
                    </p>
                </div>
            </div>

            <InviteCodeCard
                initialCode={inviteData.code || ''}
                tenantSlug={inviteData.slug || ''}
            />

            <TeamList members={members || []} currentUserId={user.id} />
        </div>
    )
}
