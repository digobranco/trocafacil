import { PublicAnamnesisForm } from '@/app/dashboard/clientes/anamnesis-public-form'
import Image from 'next/image'

interface Props {
    params: Promise<{ token: string }>
}

export default async function PublicAnamnesisPage({ params }: Props) {
    const { token } = await params

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
                <div className="flex items-center gap-2 font-bold text-2xl text-indigo-600">
                    TrocaFácil
                </div>
            </div>

            <main className="w-full">
                <PublicAnamnesisForm token={token} />
            </main>

            <footer className="mt-12 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                Powered by TrocaFácil
            </footer>
        </div>
    )
}
