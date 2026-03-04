'use client'

import * as React from 'react'

interface ProgressProps {
    value?: number
    className?: string
}

export function Progress({ value = 0, className = "" }: ProgressProps) {
    return (
        <div className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
            <div
                className="h-full w-full flex-1 bg-indigo-600 transition-all"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </div>
    )
}
