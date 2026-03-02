import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import { getImpersonatingTenantId } from '@/utils/impersonation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    // Super Admin impersonation check
    let impersonatingTenantName: string | null = null
    let effectiveRole = profile?.role

    if (profile?.role === 'super_admin') {
        const impersonatingTenantId = await getImpersonatingTenantId()
        if (impersonatingTenantId) {
            // Super admin is impersonating — fetch tenant name for the banner
            const { data: tenant } = await supabase
                .from('tenants')
                .select('name')
                .eq('id', impersonatingTenantId)
                .single()

            if (tenant) {
                impersonatingTenantName = tenant.name
                effectiveRole = 'admin' // Show admin sidebar items
            } else {
                // Invalid tenant ID in cookie — redirect to admin
                redirect('/admin')
            }
        } else {
            // Super Admin not impersonating — redirect to admin panel
            redirect('/admin')
        }
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Impersonation Banner */}
            {impersonatingTenantName && (
                <ImpersonationBanner tenantName={impersonatingTenantName} />
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden w-64 border-r bg-muted/40 md:block">
                    <Sidebar className="h-full" role={effectiveRole as any} />
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-14 md:h-16 items-center justify-between border-b px-3 md:px-6">
                        {/* Mobile Menu */}
                        <MobileSidebar role={effectiveRole as any} />
                        <div className="ml-auto flex items-center space-x-4">
                            <UserNav email={user.email!} />
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-3 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
