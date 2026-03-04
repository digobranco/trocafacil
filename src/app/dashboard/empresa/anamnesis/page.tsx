import { checkRole } from '@/utils/roles'
import { getAnamnesisTemplates } from '../anamnesis-template-actions'
import AnamnesisTemplatesClient from './anamnesis-templates-client'

export default async function AnamnesisTemplatesPage() {
    await checkRole(['admin'])
    const templates = await getAnamnesisTemplates()

    return <AnamnesisTemplatesClient initialTemplates={templates} />
}
