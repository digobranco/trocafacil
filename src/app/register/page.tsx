'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup } from '../login/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { validateCPF, formatCPF } from '@/utils/validation'

function RegisterForm() {
    const searchParams = useSearchParams()

    // Parameters from URL
    const code = searchParams.get('code')
    const emailParam = searchParams.get('email')
    const nameParam = searchParams.get('name')

    const [phone, setPhone] = useState('')
    const [cpf, setCpf] = useState('')
    const [loading, setLoading] = useState(false)

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '') // Remove non-digits
        if (value.length > 11) value = value.slice(0, 11)

        // Mask (XX) XXXXX-XXXX or (XX) XXXX-XXXX
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2')
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1')
        }
        setPhone(value)
    }

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpf(formatCPF(e.target.value))
    }

    async function handleSignup(formData: FormData) {
        // Validate CPF if provided
        const cpfValue = formData.get('cpf') as string
        if (cpfValue && !validateCPF(cpfValue)) {
            alert('CPF inválido. Verifique o número informado.')
            return
        }

        setLoading(true)
        try {
            await signup(formData)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Crie sua conta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Preencha seus dados para começar a gerenciar seus agendamentos
                    </p>
                    {code && (
                        <div className="mt-4 p-2 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-700 font-medium">
                            ✓ Link de convite detectado
                        </div>
                    )}
                </div>

                <form action={handleSignup} className="mt-8 space-y-6" autoComplete="off">
                    <input type="hidden" name="invite_code" key={code || 'no-code'} defaultValue={code || ''} />

                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="full-name" className="text-sm font-medium mb-1 block">
                                Nome Completo
                            </label>
                            <input
                                id="full-name"
                                name="full_name"
                                type="text"
                                required
                                autoComplete="new-name"
                                defaultValue={nameParam || ''}
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Ex: João Silva"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone" className="text-sm font-medium mb-1 block">
                                    Telefone/WhatsApp
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    autoComplete="off"
                                    className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label htmlFor="cpf" className="text-sm font-medium mb-1 block">
                                    CPF (Opcional)
                                </label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    value={cpf}
                                    onChange={handleCPFChange}
                                    autoComplete="off"
                                    className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email-address" className="text-sm font-medium mb-1 block">
                                Email (Usuário)
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                autoComplete="new-email"
                                defaultValue={emailParam || ''}
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="text-sm font-medium mb-1 block">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="********"
                            />
                        </div>
                    </div>


                    <div className="flex flex-col gap-4 mt-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Criando conta...' : 'Criar minha conta'}
                        </Button>

                        <div className="text-center text-sm text-gray-500">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 underline">
                                Acesse aqui
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
            <RegisterForm />
        </Suspense>
    )
}
