/**
 * @file textarea.jsx
 * @description Componente reutilizable de UI: textarea.
 * @module Frontend Component
 * @path /frontend/src/components/ui/textarea.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className
            )}
            ref={ref}
            {...props} />
    )
})
Textarea.displayName = "Textarea"

export { Textarea }
