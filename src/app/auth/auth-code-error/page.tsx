import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Erro de Autenticação</h1>
            <p className="text-muted-foreground mb-6">
                Não foi possível validar seu código de acesso. Isso pode acontecer se o link expirou ou já foi utilizado.
            </p>
            <Button asChild>
                <Link href="/login">Voltar para o Login</Link>
            </Button>
        </div>
    )
}
