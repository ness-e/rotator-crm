/**
 * @file sonner.jsx
 * @description Componente reutilizable de UI: sonner.
 * @module Frontend Component
 * @path /frontend/src/components/ui/sonner.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
    return (
        <Sonner
            position="top-right"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
        />
    )
}
