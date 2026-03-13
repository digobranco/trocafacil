'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const data = {
        email,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            redirect(`/login?error=Email não confirmado. Verifique sua caixa de entrada.&unconfirmed=true&email=${encodeURIComponent(email)}`)
        }
        redirect('/login?error=Não foi possível autenticar. Verifique seus dados.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function resendConfirmation(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent('Erro ao reenviar: ' + error.message)}`)
    }

    redirect('/login?message=Email de confirmação reenviado com sucesso. Verifique sua caixa de entrada.')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    // Preparar dados para o cadastro
    const email = formData.get('email') as string
    const inviteCode = formData.get('invite_code') as string

    const signupPayload = {
        email: email,
        password: formData.get('password') as string,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        data: {
            full_name: formData.get('full_name') as string || 'Novo Usuário',
            phone: formData.get('phone') as string || null,
            cpf: (formData.get('cpf') as string)?.replace(/\D/g, '') || null,
            invite_code: inviteCode && inviteCode.trim() !== '' ? inviteCode.trim() : null
        }
        },
    }

    // Realizar cadastro
    const { data: authData, error } = await supabase.auth.signUp(signupPayload)

    if (error) {
        console.error('Signup Error:', error)
        // If user already exists but is unconfirmed, we might want to suggest resending
        if (error.message.includes('User already registered')) {
            redirect(`/login?error=Este email já possui um cadastro pendente de confirmação.&unconfirmed=true&email=${encodeURIComponent(email)}`)
        }
        redirect(`/login?error=${encodeURIComponent('Erro no cadastro: ' + error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Cadastro realizado! Verifique seu email para confirmar o acesso.')
}
