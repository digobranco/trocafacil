'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createService } from './actions'
import { Plus } from 'lucide-react'

export function NewServiceDialog() {
    const [open, setOpen] = useState(false)

    async function clientAction(formData: FormData) {
        const res = await createService(formData)
        if (res?.success) {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Serviço</DialogTitle>
                    <DialogDescription>
                        Crie um novo tipo de serviço para agendamento.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input id="name" name="name" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                            Duração (min)
                        </Label>
                        <Input
                            id="duration"
                            name="duration"
                            type="number"
                            className="col-span-3"
                            required
                            defaultValue="60"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Preço
                        </Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Descrição
                        </Label>
                        <Textarea id="description" name="description" className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
