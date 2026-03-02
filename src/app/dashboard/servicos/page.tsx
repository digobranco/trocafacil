import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceDialog } from './service-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Dumbbell, Clock, DollarSign } from 'lucide-react'
import { checkRole } from '@/utils/roles'

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

            {!services?.length ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h4>
                        <p className="text-muted-foreground mb-4">
                            Crie seu primeiro serviço para começar.
                        </p>
                        <ServiceDialog />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Card key={service.id} className={!service.active ? 'opacity-60' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                    </div>
                                    <Badge
                                        variant={service.active ? 'default' : 'secondary'}
                                        className={service.active
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                        }
                                    >
                                        {service.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" /> Duração:
                                        </span>
                                        <span className="font-medium">{service.duration_minutes} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5" /> Preço:
                                        </span>
                                        <span className="font-medium">
                                            {service.price ? `R$ ${service.price}` : '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <ServiceDialog
                                        service={service}
                                        trigger={
                                            <Button variant="outline" size="sm">
                                                <Pencil className="mr-1 h-3 w-3" /> Editar
                                            </Button>
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

