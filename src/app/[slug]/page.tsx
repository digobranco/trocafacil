import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Tag } from 'lucide-react'
import Link from 'next/link'

export default async function PublicTenantPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient()
    const { slug } = params

    // Fetch tenant by slug
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

    if (tenantError || !tenant) {
        return notFound()
    }

    if (!tenant.is_active) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                <Card className="max-w-md w-full text-center p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Página Temporariamente Indisponível</h1>
                    <p className="text-gray-600 mb-6">Esta empresa pausou os agendamentos online no momento.</p>
                    <Button asChild variant="outline">
                        <Link href="/">Voltar para Início</Link>
                    </Button>
                </Card>
            </div>
        )
    }

    // Fetch active services for this tenant
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('active', true)
        .order('name')

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b px-6 py-8 md:py-12 mb-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {tenant.logo_url && (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border bg-gray-50 flex items-center justify-center p-2 shadow-sm">
                            <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">{tenant.name}</h1>
                        <p className="text-lg text-gray-600 mt-2 italic">Agendamento de Serviços Online</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Tag className="h-5 w-5 text-indigo-500" />
                            Serviços Disponíveis
                        </h2>

                        {services && services.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {services.map((service) => (
                                    <Card key={service.id} className="hover:shadow-md transition-shadow border-indigo-50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">{service.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {service.duration_minutes} min
                                                    </div>
                                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                        R$ {service.price?.toFixed(2)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button asChild className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
                                                <Link href={`/login?redirect=/${slug}`}>Agendar Agora</Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center border-dashed">
                                <p className="text-muted-foreground italic">Nenhum serviço disponível para agendamento online no momento.</p>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-indigo-600 text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">Pronto para agendar?</CardTitle>
                                <CardDescription className="text-indigo-100">
                                    Crie sua conta ou faça login para gerenciar seus horários e pagamentos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/login">Já sou cliente</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full bg-transparent border-white text-white hover:bg-white/10">
                                    <Link href="/login?register=true">Cadastrar-se</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Sobre a {tenant.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-600 space-y-4">
                                <p>Gerenciamos agendamentos e reposições de forma automatizada para oferecer a melhor experiência.</p>
                                <div className="p-3 bg-gray-50 rounded-lg text-[11px] leading-relaxed">
                                    <p className="font-bold mb-1 uppercase tracking-wider text-gray-400">Políticas:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Cancelamento com até {tenant.cancellation_window_hours}h de antecedência gera crédito.</li>
                                        <li>Créditos expiram em {tenant.credit_validity_days} dias.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <footer className="mt-20 py-8 text-center text-sm text-gray-400 border-t">
                <p>Equipado por <span className="font-bold text-indigo-500">TrocaFácil</span></p>
                <div className="mt-2 flex justify-center gap-4">
                    <Link href="/" className="hover:text-indigo-400">Página Inicial</Link>
                    <span>•</span>
                    <Link href="/login" className="hover:text-indigo-400">Área Administrativa</Link>
                </div>
            </footer>
        </div>
    )
}
