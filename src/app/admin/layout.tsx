import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Users, Building2, LogOut } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is super_admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    console.log('[AdminLayout] User:', user.email, 'Role:', profile?.role)

    if (profile?.role !== 'super_admin') {
        console.log('[AdminLayout] Access denied using role:', profile?.role)
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">TrocaFácil <span className="text-xs text-slate-400 block font-normal">Super Admin</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/tenants" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
                        <Building2 className="w-5 h-5" />
                        <span>Empresas</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
                        <Users className="w-5 h-5" />
                        <span>Usuários</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <form action="/auth/signout" method="post">
                        <button className="flex items-center space-x-3 px-3 py-2 text-slate-400 hover:text-white transition-colors w-full">
                            <LogOut className="w-5 h-5" />
                            <span>Sair</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    )
}
