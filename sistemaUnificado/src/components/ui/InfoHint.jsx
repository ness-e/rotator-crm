/**
 * @file InfoHint.jsx
 * @description Componente reutilizable para mostrar ayuda/información contextual.
 * @module Frontend Component
 * @path /frontend/src/components/ui/InfoHint.jsx
 */

import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CircleHelp } from 'lucide-react'

/**
 * @param {Object} props
 * @param {string|React.ReactNode} props.content - El texto o componente de ayuda.
 * @param {string} [props.title] - Título opcional (solo para popover).
 * @param {'tooltip'|'popover'} [props.variant='tooltip'] - Estilo de visualización.
 * @param {string} [props.className] - Clases adicionales para el icono.
 */
export default function InfoHint({ 
  content, 
  title, 
  variant = 'tooltip', 
  className = '',
  children
}) {
  if (!content) return children || null;

  const trigger = children ? (
    <div className="cursor-help inline-flex items-center gap-1.5">
      {children}
      <CircleHelp className={`h-3 w-3 text-muted-foreground/40 ${className}`} />
    </div>
  ) : (
    <button
      type="button"
      className={`inline-flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors cursor-help outline-none focus:ring-2 focus:ring-primary/20 rounded-full ${className}`}
      aria-label="Información adicional"
    >
      <CircleHelp className="h-3.5 w-3.5" />
    </button>
  )

  const contentElement = (
    <div className="text-xs leading-relaxed">
      {content}
    </div>
  );

  if (variant === 'popover' || (typeof content !== 'string')) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 shadow-2xl border-slate-200">
          {title && <h4 className="font-bold text-sm mb-2 border-b pb-1">{title}</h4>}
          {contentElement}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {trigger}
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] p-3 text-xs bg-slate-900 text-slate-100 border-none shadow-xl">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
