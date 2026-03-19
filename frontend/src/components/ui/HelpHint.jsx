/**
 * @file HelpHint.jsx
 * @description Componente reutilizable de UI: HelpHint.
 * @module Frontend Component
 * @path /frontend/src/components/ui/HelpHint.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function HelpHint({ title = 'Ayuda', children, size = 'icon' }){
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Ayuda"
          title="Ayuda"
          className="inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800"
          style={{ width: 28, height: 28, fontSize: 14, lineHeight: 1 }}
          onClick={()=> setOpen(true)}
        >
          ?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-slate-300">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
