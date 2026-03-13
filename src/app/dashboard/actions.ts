'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createTenant(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Insert tenant
    const { data: tenant, error } = await supabase
        .from('tenants')
        .insert({ name, slug })
        .select()
        .single()

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar o link personalizado da sua empresa, tente outro link' }
    }

    // Update user profile with tenant_id and role='admin'
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id, role: 'admin' })
        .eq('id', user.id)

    if (profileError) {
        console.error(profileError)
        return { error: 'Error updating profile' }
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
}

export async function updateTenantSettings(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const slugInput = formData.get('slug') as string
    const is_active = formData.get('is_active') === 'on'
    const cancellationWindow = parseInt(formData.get('cancellation_window_hours') as string || '24')
    const creditValidity = parseInt(formData.get('credit_validity_days') as string || '30')

    // Format slug: lowercase, no spaces, no special chars
    const slug = slugInput?.toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-z0-9-]/g, '-') // replace non-alphanumeric with -
        .replace(/-+/g, '-') // remove double hyphens
        .replace(/^-|-$/g, '') // remove leading/trailing hyphens

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user profile to check tenant_id and role
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return { error: 'Permissão negada.' }
    }

    // Update tenant
    const { error } = await supabase
        .from('tenants')
        .update({
            name: name,
            slug: slug,
            is_active,
            cancellation_window_hours: cancellationWindow,
            credit_validity_days: creditValidity
        })
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update Tenant Error:', error)
        return { error: 'Erro ao atualizar configurações.' }
    }

    revalidatePath('/dashboard/configuracoes')
    return { success: true, message: 'Configurações salvas com sucesso!' }
}

export async function getProfessionalInviteCode() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id || profile.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('professional_invite_code, slug')
        .eq('id', profile.tenant_id)
        .single()

    return {
        code: tenant?.professional_invite_code,
        slug: tenant?.slug
    }
}

export async function regenerateProfessionalInviteCode() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id || profile.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const newCode = Math.random().toString(36).substring(2, 12).toLowerCase()

    const { error } = await supabase
        .from('tenants')
        .update({ professional_invite_code: newCode })
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Regenerate Code Error:', error)
        return { error: 'Erro ao gerar novo código.' }
    }

    revalidatePath('/dashboard/equipe')
    return { success: true, code: newCode }
}

export async function joinTenantByCode(formData: FormData) {
    const supabase = await createClient()
    const inviteCode = (formData.get('invite_code') as string)?.trim()

    if (!inviteCode) return { error: 'Código de convite é obrigatório.' }

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Find tenant by any of the 3 invite codes
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, is_active, invite_code, admin_invite_code, professional_invite_code')
        .or(`invite_code.eq."${inviteCode}",admin_invite_code.eq."${inviteCode}",professional_invite_code.eq."${inviteCode}"`)
        .maybeSingle()

    if (tenantError || !tenant) {
        return { error: 'Código de convite inválido ou empresa não encontrada.' }
    }

    if (!tenant.is_active) {
        return { error: 'Esta empresa não está aceitando novos membros no momento.' }
    }

    // Determine role based on which code was used
    let role: 'admin' | 'professional' | 'customer' = 'customer'
    if (tenant.admin_invite_code === inviteCode) role = 'admin'
    else if (tenant.professional_invite_code === inviteCode) role = 'professional'

    // Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            tenant_id: tenant.id,
            role: role
        })
        .eq('id', user.id)

    if (profileError) {
        console.error('Join Tenant Error:', profileError)
        return { error: 'Erro ao vincular-se à empresa.' }
    }

    // Get the current profile data to sync with customers/professionals
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email, cpf')
        .eq('id', user.id)
        .single()

    // Robust CPF check: try profile first, then fallback to auth metadata
    const userCpf = profile?.cpf || (user.user_metadata?.cpf as string)?.replace(/\D/g, '')

    // Also create or link a customer record for CRM/Booking if role is customer
    if (role === 'customer') {
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('email', profile?.email)
            .maybeSingle()

        if (existingCustomer) {
            await supabase.from('customers').update({
                profile_id: user.id,
                full_name: profile?.full_name || 'Novo Cliente',
                phone: profile?.phone,
                cpf: userCpf
            }).eq('id', existingCustomer.id)
        } else {
            await supabase.from('customers').insert({
                tenant_id: tenant.id,
                profile_id: user.id,
                full_name: profile?.full_name || 'Novo Cliente',
                phone: profile?.phone,
                email: profile?.email,
                cpf: userCpf
            })
        }
    } 
    // Or professional record if role is professional
    else if (role === 'professional') {
        const { data: existingProfessional } = await supabase
            .from('professionals')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('email', profile?.email)
            .maybeSingle()

        if (existingProfessional) {
            await supabase.from('professionals').update({
                profile_id: user.id,
                name: profile?.full_name || 'Novo Profissional',
                phone: profile?.phone,
                cpf: userCpf
            }).eq('id', existingProfessional.id)
        } else {
            await supabase.from('professionals').insert({
                tenant_id: tenant.id,
                profile_id: user.id,
                name: profile?.full_name || 'Novo Profissional',
                phone: profile?.phone,
                email: profile?.email,
                cpf: userCpf,
                active: true
            })
        }
    }


    revalidatePath('/dashboard', 'layout')
    return { success: true }
}


export async function updateUserRole(targetUserId: string, newRole: 'admin' | 'professional' | 'customer') {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user profile to check if they are the admin of the tenant
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!adminProfile?.tenant_id || adminProfile.role !== 'admin') {
        return { error: 'Apenas administradores podem gerenciar a equipe.' }
    }

    // Check if target user belongs to the same tenant
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile || targetProfile.tenant_id !== adminProfile.tenant_id) {
        return { error: 'Usuário não encontrado nesta empresa.' }
    }

    // Update role
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

    if (error) {
        console.error('Update Role Error:', error)
        return { error: 'Erro ao atualizar papel do usuário.' }
    }

    revalidatePath('/dashboard/equipe')
    return { success: true }
}

export async function uploadTenantLogo(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return { error: 'Permissão negada.' }
    }

    const file = formData.get('logo') as File
    if (!file || file.size === 0) {
        return { error: 'Nenhum arquivo selecionado.' }
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
        return { error: 'Formato inválido. Use PNG, JPG, WebP ou SVG.' }
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        return { error: 'Arquivo muito grande. Máximo 2MB.' }
    }

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${profile.tenant_id}/logo.${ext}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        return { error: 'Erro ao fazer upload do logo.' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath)

    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Update tenant
    const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: logoUrl })
        .eq('id', profile.tenant_id)

    if (updateError) {
        console.error('Update Logo Error:', updateError)
        return { error: 'Erro ao salvar logo.' }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true, logoUrl }
}

export async function updateUserProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '')

    // Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone,
            cpf: cpf
        })
        .eq('id', user.id)

    if (profileError) {
        console.error('Update Profile Error:', profileError)
        return { error: 'Erro ao atualizar perfil.' }
    }

    // Sync with Customers
    await supabase
        .from('customers')
        .update({
            full_name: fullName,
            phone: phone,
            cpf: cpf
        })
        .eq('profile_id', user.id)

    // Sync with Professionals
    await supabase
        .from('professionals')
        .update({
            name: fullName,
            phone: phone,
            cpf: cpf
        })
        .eq('profile_id', user.id)

    revalidatePath('/dashboard/configuracoes')
    return { success: true }
}


