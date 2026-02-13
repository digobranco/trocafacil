import { login } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string, error: string }>
}) {
    const params = await searchParams

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Acesse sua conta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Bem-vindo de volta! Insira seus dados para entrar.
                    </p>
                </div>

                {params?.message && (
                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-center font-medium">
                        {params.message}
                    </div>
                )}

                {params?.error && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-center font-medium">
                        {params.error}
                    </div>
                )}

                <form className="mt-8 space-y-6">
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="text-sm font-medium mb-1 block">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Seu email"
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
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Sua senha"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-6">
                        <Button
                            formAction={login}
                            className="w-full"
                        >
                            Entrar
                        </Button>

                        <div className="text-center text-sm text-gray-500">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 underline">
                                Criar conta nova
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
