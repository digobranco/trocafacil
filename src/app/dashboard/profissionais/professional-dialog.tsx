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
import { ProfessionalForm } from './professional-form'
import { Plus } from 'lucide-react'

interface ProfessionalDialogProps {
    professional?: any
    trigger?: React.ReactNode
}

export function ProfessionalDialog({ professional, trigger }: ProfessionalDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!professional

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Profissional
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Profissional' : 'Adicionar Profissional'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize os dados do profissional.' : 'Cadastre um novo membro da equipe.'}
                    </DialogDescription>
                </DialogHeader>
                <ProfessionalForm professional={professional} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
