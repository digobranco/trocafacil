'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ServiceForm } from './service-form'
import { Plus, Pencil } from 'lucide-react'

interface ServiceDialogProps {
    service?: any
    trigger?: React.ReactNode
}

export function ServiceDialog({ service, trigger }: ServiceDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!service

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Serviço' : 'Adicionar Serviço'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize os detalhes do serviço.' : 'Crie um novo tipo de serviço.'}
                    </DialogDescription>
                </DialogHeader>
                <ServiceForm service={service} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
