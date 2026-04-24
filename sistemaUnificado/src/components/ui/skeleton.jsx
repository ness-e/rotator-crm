/**
 * @file skeleton.jsx
 * @description Componente reutilizable de UI: skeleton.
 * @module Frontend Component
 * @path /frontend/src/components/ui/skeleton.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
    return (
        <div
            data-slot='skeleton'
            className={cn('animate-pulse rounded-md bg-accent', className)}
            {...props}
        />
    )
}

export { Skeleton }
