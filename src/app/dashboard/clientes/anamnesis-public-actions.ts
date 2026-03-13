'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getAuthContext } from '@/utils/auth-context'
import { revalidatePath } from 'next/cache'

export async function generatePreAnamnesisLink(customerId: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role === 'customer') throw new Error('Forbidden')

    // INSERT a new token to ensure every link is unique
    const { data, error } = await ctx.supabase
        .from('pre_anamnesis_tokens')
        .insert({
            client_id: customerId,
            tenant_id: ctx.tenantId
        })
        .select('token')
        .single()

    if (error) {
        console.error('Error generating pre-anamnesis token:', error)
        return { error: 'Falha ao gerar o link.' }
    }

    // Determine the base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const link = `${baseUrl}/public/anamnese/${data.token}`

    return { success: true, link }
}

// Default questions used when no custom templates exist
const DEFAULT_FIELDS = [
    { id: 'objective', label: 'Objetivo do Aluno', field_type: 'textarea' as const, options: null, sort_order: 0, placeholder: 'Ex: Fortalecimento lombar, flexibilidade...' },
    { id: 'history', label: 'Histórico de Saúde / Patologias', field_type: 'textarea' as const, options: null, sort_order: 1, placeholder: 'Ex: Hérnia de disco L4-L5, cirurgias anteriores...' },
    { id: 'restrictions', label: 'Restrições / Observações Importantes', field_type: 'textarea' as const, options: null, sort_order: 2, placeholder: 'Ex: Evitar flexão excessiva de tronco...' },
]

export async function getPublicAnamnesisData(token: string) {
    // Use admin client to bypass potential RLS on templates/tenants
    const supabase = createAdminClient()

    // 1. Validate Token
    const { data: tokenData, error: tokenError } = await supabase
        .from('pre_anamnesis_tokens')
        .select(`
            client_id, 
            tenant_id, 
            used_at,
            tenants(name, logo_url)
        `)
        .eq('token', token)
        .single()

    if (tokenError || !tokenData) {
        return { error: 'Link inválido ou expirado.' }
    }

    if (tokenData.used_at) {
        return { error: 'Este link já foi utilizado e não aceita mais respostas.' }
    }

    // 2. Fetch Templates
    const { data: templates, error: templatesError } = await supabase
        .from('anamnesis_templates')
        .select('*')
        .eq('tenant_id', tokenData.tenant_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    const finalTemplates = templates && templates.length > 0 ? templates : DEFAULT_FIELDS

    return {
        tenantName: (tokenData.tenants as any)?.name || 'Espaço',
        tenantLogo: (tokenData.tenants as any)?.logo_url || null,
        templates: finalTemplates,
        clientId: tokenData.client_id,
        tenantId: tokenData.tenant_id
    }
}

export async function submitPublicAnamnesis(token: string, content: any) {
    // Use admin client to bypass RLS safely
    const supabase = createAdminClient()

    // 1. Re-validate Token (security)
    const { data: tokenData, error: tokenError } = await supabase
        .from('pre_anamnesis_tokens')
        .select('client_id, tenant_id, used_at')
        .eq('token', token)
        .single()

    if (tokenError || !tokenData) {
        return { error: 'Não foi possível validar o envio.' }
    }

    if (tokenData.used_at) {
        return { error: 'Este link já foi utilizado.' }
    }

    // 2. Save Anamnesis
    const { error: saveError } = await supabase
        .from('anamnesis')
        .upsert({
            tenant_id: tokenData.tenant_id,
            client_id: tokenData.client_id,
            content,
            updated_at: new Date().toISOString()
        }, { onConflict: 'client_id' })

    if (saveError) {
        console.error('Error saving public anamnesis:', saveError)
        return { error: 'Falha ao salvar a ficha.' }
    }

    // 3. Mark token as used
    const { error: markError } = await supabase
        .from('pre_anamnesis_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)

    if (markError) {
        console.error('Error marking token as used:', markError)
    }

    return { success: true }
}
