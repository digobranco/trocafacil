import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAllServicesForConfiguration } from './actions'
import { ServicesForm } from './services-form'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function ProfessionalServicesPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get professional details
    const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('id, name, tenant_id')
        .eq('id', id)
        .single()

    if (profError || !professional) {
        notFound()
    }

    // Get all services with configuration
    const services = await getAllServicesForConfiguration(id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Serviços de {professional.name}</h1>
                <p className="text-muted-foreground mt-2">
                    Configure os serviços oferecidos por este profissional e personalize preços se necessário.
                </p>
            </div>

            <ServicesForm professionalId={id} services={services} />
        </div>
    )
}
