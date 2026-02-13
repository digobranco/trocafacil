'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=Não foi possível autenticar. Verifique seus dados.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    // Preparar dados para o cadastro
    const signupPayload = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                full_name: formData.get('full_name') as string || 'Novo Usuário',
                phone: formData.get('phone') as string || null,
                invite_code: formData.get('invite_code') as string || null
            }
        },
    }

    // Realizar cadastro
    const { data: authData, error } = await supabase.auth.signUp(signupPayload)

    if (error) {
        console.error('Signup Error:', error)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Verifique seu email para confirmar o cadastro.')
}
