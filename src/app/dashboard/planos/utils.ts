import type { PlanType } from './actions'

export function getPlanTypeLabel(type: PlanType): string {
    switch (type) {
        case 'weekly_frequency': return 'Frequência Semanal'
        case 'monthly_credits': return 'Créditos Mensais'
        case 'package': return 'Pacote Avulso'
        case 'unlimited': return 'Ilimitado'
        default: return type
    }
}
