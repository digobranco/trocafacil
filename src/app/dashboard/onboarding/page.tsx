'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { joinTenantByCode } from '../actions'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const res = await joinTenantByCode(formData)

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex h-full items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Bem-vindo ao TrocaFácil</CardTitle>
                    <CardDescription>
                        Você ainda não está vinculado a nenhuma empresa.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite_code">Código de Convite</Label>
                            <Input
                                id="invite_code"
                                name="invite_code"
                                placeholder="Insira o código de fornecido pelo seu administrador"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm font-medium text-destructive">
                                {error}
                            </p>
                        )}
                        <div className="text-sm text-muted-foreground italic">
                            Dica: Se você é um proprietário e deseja cadastrar sua própria empresa, vá para as configurações (se tiver permissão) ou entre em contato com o suporte.
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processando...' : 'Vincular-me agora'}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="w-full text-xs"
                            onClick={() => router.push('/dashboard/configuracoes')}
                        >
                            Desejo criar minha própria empresa
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
