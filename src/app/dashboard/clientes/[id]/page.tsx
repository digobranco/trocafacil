import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getCustomerDetails } from '../actions'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User, Phone, Mail, Calendar, UserCheck, ShieldAlert, FileText, ExternalLink, Pencil, History } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditManager } from '../credit-manager'
import { CreditHistory } from '../credit-history'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CustomerDialog } from '../new-customer-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getClinicalDetails } from '../clinical-actions'
import { AnamnesisForm } from '../anamnesis-form'
import { EvolutionTimeline } from '../evolution-timeline'
import { InviteButton } from '../invite-button'
import { CustomerAppointments } from '../customer-appointments'
import { ClientMembershipCard } from '../client-membership-card'

interface Props {
    params: Promise<{ id: string }>
}

export default async function CustomerDetailsPage({ params }: Props) {
    const { id } = await params

    // PARALLEL: fetch customer details and clinical data simultaneously
    const [customer, clinicalDetails] = await Promise.all([
        getCustomerDetails(id),
        getClinicalDetails(id)
    ])

    if (!customer) {
        notFound()
    }

    const linkedProfile = customer.linked_profile
    // @ts-ignore
    const creditCount = customer.credits?.[0]?.quantity || 0

    // We pass the customer id to the client component which will fetch membership data

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/clientes">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">{customer.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Cliente desde {format(new Date(customer.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                            <Badge variant={customer.active ? "default" : "secondary"} className={customer.active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-3" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 px-3"}>
                                {customer.active ? "Ativo" : "Inativo"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <CustomerDialog
                    customer={customer}
                    trigger={
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar Cliente
                        </Button>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="info">Informações</TabsTrigger>
                            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                            <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
                            <TabsTrigger value="evolution">Evolução</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-indigo-500" />
                                        Informações de Contato
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Telefone</p>
                                            <p className="font-medium">{customer.phone || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                                            <p className="font-medium">{customer.email || 'Não informado'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-indigo-500" />
                                        Observações Internas
                                    </CardTitle>
                                    <CardDescription>Notas visíveis apenas para a equipe</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100 min-h-[100px] text-slate-700 italic">
                                        {customer.notes || 'Nenhuma observação cadastrada para este cliente.'}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <History className="h-5 w-5 text-indigo-500" />
                                        Histórico de Créditos
                                    </CardTitle>
                                    <CardDescription>Cronologia de entradas e saídas de créditos</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CreditHistory customerId={customer.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="appointments" className="space-y-6">
                            <CustomerAppointments customerId={customer.id} />
                        </TabsContent>

                        <TabsContent value="anamnesis" className="space-y-6">
                            <AnamnesisForm customerId={customer.id} initialData={clinicalDetails?.anamnesis} templates={clinicalDetails?.templates || []} />
                        </TabsContent>

                        <TabsContent value="evolution" className="space-y-6">
                            <EvolutionTimeline customerId={customer.id} initialEvolutions={clinicalDetails?.evolutions || []} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Side Column: Credits and User Link */}
                <div className="space-y-6">
                    {/* Membership Plan Section */}
                    <ClientMembershipCard clientId={customer.id} clientName={customer.full_name} />

                    {/* Credits Section */}
                    <Card className="border-indigo-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-indigo-500" />
                                Gestão Financeira
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreditManager customerId={customer.id} initialCredits={creditCount} />
                        </CardContent>
                    </Card>

                    {/* Account Linking Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                                <UserCheck className="h-5 w-5 text-green-500" />
                                Usuário do Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {linkedProfile ? (
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-green-700 uppercase">Conta Vinculada</span>
                                            <Badge className="bg-green-500 text-[9px]">VINCULADO</Badge>
                                        </div>
                                        <p className="text-sm font-medium">{linkedProfile.full_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{linkedProfile.email}</p>
                                        <div className="pt-2 border-t border-green-100 flex items-center justify-between text-[10px] text-green-600 font-medium">
                                            <span>Membro desde {format(new Date(linkedProfile.created_at), 'dd/MM/yyyy')}</span>
                                            <span className="capitalize">{linkedProfile.role}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                        Este cliente possui acesso ao sistema e pode realizar agendamentos próprios usando seus créditos.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-600">Sem conta vinculada</p>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            Este cliente ainda não criou uma conta ou não usou o código de convite da sua empresa.
                                        </p>
                                    </div>
                                    <InviteButton
                                        customerName={customer.full_name}
                                        customerEmail={customer.email}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
