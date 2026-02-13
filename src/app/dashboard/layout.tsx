import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'

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

    // Se for Super Admin tentando acessar dashboard comum, redireciona para admin
    if (profile?.role === 'super_admin') {
        redirect('/admin')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="hidden w-64 border-r bg-muted/40 md:block">
                <Sidebar className="h-full" role={profile?.role as any} />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between border-b px-6">
                    <div className="md:hidden">
                        Menu
                    </div>
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav email={user.email!} />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
