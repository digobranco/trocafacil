'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenantByAdmin } from '../../actions'
import { useRouter } from 'next/navigation'

export default function NewTenantPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const res = await createTenantByAdmin(formData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/admin/tenants')
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Nova Empresa</h3>
                <p className="text-muted-foreground">
                    Crie uma nova organização para o sistema.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Studio Pilates Zen"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Link Personalizado (Slug)</Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">trocafacil.com/</span>
                            <Input
                                id="slug"
                                name="slug"
                                placeholder="studio-zen"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Empresa'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
