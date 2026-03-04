'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewToggleProps {
    storageKey?: string
    defaultView?: 'cards' | 'list'
    onViewChange?: (view: 'cards' | 'list') => void
}

export function useViewToggle(storageKey: string = 'viewMode', defaultView: 'cards' | 'list' = 'cards') {
    const [view, setView] = useState<'cards' | 'list'>(defaultView)

    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved === 'cards' || saved === 'list') {
            setView(saved)
        }
    }, [storageKey])

    function toggle(newView: 'cards' | 'list') {
        setView(newView)
        localStorage.setItem(storageKey, newView)
    }

    return { view, toggle }
}

export function ViewToggle({ view, onToggle }: { view: 'cards' | 'list', onToggle: (v: 'cards' | 'list') => void }) {
    return (
        <div className="hidden md:flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
                variant={view === 'cards' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggle('cards')}
                title="Visualizar como cards"
            >
                <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggle('list')}
                title="Visualizar como lista"
            >
                <List className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
