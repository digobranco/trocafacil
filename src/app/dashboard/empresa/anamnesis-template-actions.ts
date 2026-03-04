'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/utils/auth-context'

export interface AnamnesisTemplate {
    id: string
    tenant_id: string
    label: string
    field_type: 'text' | 'textarea' | 'boolean' | 'select'
    options: string[] | null
    sort_order: number
    is_active: boolean
}

export async function getAnamnesisTemplates(): Promise<AnamnesisTemplate[]> {
    const ctx = await getAuthContext()
    if (!ctx) return []

    const { data, error } = await ctx.supabase
        .from('anamnesis_templates')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching anamnesis templates:', error)
        return []
    }

    return data || []
}

export async function createAnamnesisTemplate(label: string, fieldType: string = 'textarea', options?: string[]) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') return { error: 'Apenas administradores podem gerenciar templates.' }

    // Get current max sort_order
    const { data: existing } = await ctx.supabase
        .from('anamnesis_templates')
        .select('sort_order')
        .eq('tenant_id', ctx.tenantId)
        .order('sort_order', { ascending: false })
        .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { error } = await ctx.supabase
        .from('anamnesis_templates')
        .insert({
            tenant_id: ctx.tenantId,
            label,
            field_type: fieldType,
            options: options || null,
            sort_order: nextOrder,
        })

    if (error) {
        console.error('Error creating anamnesis template:', error)
        return { error: 'Erro ao criar pergunta.' }
    }

    revalidatePath('/dashboard/empresa/anamnesis')
    return { success: true }
}

export async function updateAnamnesisTemplate(id: string, label: string, fieldType: string, isActive: boolean, options?: string[]) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') return { error: 'Permissão negada.' }

    const { error } = await ctx.supabase
        .from('anamnesis_templates')
        .update({ label, field_type: fieldType, is_active: isActive, options: options || null })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error updating anamnesis template:', error)
        return { error: 'Erro ao atualizar pergunta.' }
    }

    revalidatePath('/dashboard/empresa/anamnesis')
    return { success: true }
}

export async function deleteAnamnesisTemplate(id: string) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') return { error: 'Permissão negada.' }

    const { error } = await ctx.supabase
        .from('anamnesis_templates')
        .delete()
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error deleting anamnesis template:', error)
        return { error: 'Erro ao excluir pergunta.' }
    }

    revalidatePath('/dashboard/empresa/anamnesis')
    return { success: true }
}

export async function reorderAnamnesisTemplates(orderedIds: string[]) {
    const ctx = await getAuthContext()
    if (!ctx) throw new Error('Unauthorized')
    if (ctx.role !== 'admin') return { error: 'Permissão negada.' }

    // Update sort_order for each template
    const updates = orderedIds.map((id, index) =>
        ctx.supabase
            .from('anamnesis_templates')
            .update({ sort_order: index })
            .eq('id', id)
            .eq('tenant_id', ctx.tenantId)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error)

    if (hasError) {
        return { error: 'Erro ao reordenar perguntas.' }
    }

    revalidatePath('/dashboard/empresa/anamnesis')
    return { success: true }
}
