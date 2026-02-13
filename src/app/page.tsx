import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-12 bg-white">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          TrocaFácil
        </div>
        <nav className="flex gap-4">
          <Button asChild variant="ghost">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Cadastrar</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 max-w-2xl">
          Agendamento Recorrente Simplificado.
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-xl">
          Gerencie aulas, alunos e reposições de forma automática. Ideal para Pilates, Personal e Terapias.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="px-8">
            <Link href="/login?message=Crie sua conta grátis">Começar Agora</Link>
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white">
        © 2024 TrocaFácil. Todos os direitos reservados.
      </footer>
    </div>
  )
}
