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
import { CustomerForm } from './customer-form'
import { UserPlus, Pencil } from 'lucide-react'

interface CustomerDialogProps {
    customer?: any // Type strictly if possible
    trigger?: React.ReactNode
}

export function CustomerDialog({ customer, trigger }: CustomerDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!customer

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize os dados do cliente.' : 'Cadastre um novo aluno ou paciente.'}
                    </DialogDescription>
                </DialogHeader>
                <CustomerForm customer={customer} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}


