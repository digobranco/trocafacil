import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAllProfessionalsForConfiguration } from './actions'
import { ProfessionalsForm } from './professionals-form'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function ServiceProfessionalsPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get service details
    const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes, tenant_id')
        .eq('id', id)
        .single()

    if (serviceError || !service) {
        notFound()
    }

    // Get all professionals with configuration
    const professionals = await getAllProfessionalsForConfiguration(id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profissionais para {service.name}</h1>
                <p className="text-muted-foreground mt-2">
                    Selecione quais profissionais do seu espaço realizam este serviço e personalize preços se necessário.
                </p>
            </div>

            <ProfessionalsForm
                serviceId={id}
                professionals={professionals}
                defaultServicePrice={service.price}
                defaultServiceDuration={service.duration_minutes}
            />
        </div>
    )
}
