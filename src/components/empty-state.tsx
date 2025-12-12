
'use client'

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import React from "react"

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    children?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
                className
            )}
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                {description}
            </p>
            {children && (
                 <div className="mt-6">
                    {children}
                </div>
            )}
        </div>
    )
}
