'use client'

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface OnboardingStep {
    id: string
    title: string
    description: string
    isCompleted: boolean
    href: string
}

interface OnboardingChecklistProps {
    progress: {
        steps: OnboardingStep[]
        percentage: number
        isFullyCompleted: boolean
    }
}

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
    if (progress.isFullyCompleted) return null

    return (
        <Card className="border-indigo-200 shadow-md overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl text-indigo-900 font-bold mb-1">
                            🚀 Vamos configurar seu espaço!
                        </CardTitle>
                        <CardDescription className="text-indigo-600/80">
                            Complete estes passos simples para começar a receber seus clientes.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-indigo-700">{progress.percentage}% Completo</span>
                        <Progress value={progress.percentage} className="w-[150px] h-2 bg-indigo-100" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {progress.steps.map((step) => (
                        <div
                            key={step.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${step.isCompleted
                                    ? 'bg-green-50/50 border-green-100'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm shadow-sm'
                                }`}
                        >
                            <div className="mt-1">
                                {step.isCompleted ? (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-200">
                                        <Circle className="h-4 w-4 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-bold ${step.isCompleted ? 'text-green-800 line-through opacity-70' : 'text-slate-900'}`}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {step.description}
                                </p>
                                {!step.isCompleted && (
                                    <Button variant="link" className="p-0 h-auto text-xs text-indigo-600 font-bold gap-1 mt-1 group" asChild>
                                        <Link href={step.href}>
                                            Começar <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
