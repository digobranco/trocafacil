'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

interface MobileSidebarProps {
    role?: 'super_admin' | 'admin' | 'professional' | 'customer'
}

export function MobileSidebar({ role }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
            </Button>
            <SheetContent side="left" className="p-0 w-64">
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                <Sidebar
                    className="h-full"
                    role={role}
                    onNavigate={() => setOpen(false)}
                />
            </SheetContent>
        </Sheet>
    )
}
