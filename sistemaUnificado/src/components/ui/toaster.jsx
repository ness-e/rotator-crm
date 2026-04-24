/**
 * @file toaster.jsx
 * @description Componente reutilizable de UI: toaster.
 * @module Frontend Component
 * @path /frontend/src/components/ui/toaster.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react'
import { subscribeToasts, dismiss } from './use-toast'

export function Toaster(){
  const [toasts, setToasts] = React.useState([])
  React.useEffect(()=> subscribeToasts(setToasts),[])
  return (
    <div style={{ position:'fixed', right:16, bottom:16, display:'grid', gap:8, zIndex:1000 }}>
      {toasts.map(t => (
        <div key={t.id} className={`rounded-md border p-3 shadow-lg text-sm ${t.variant==='destructive' ? 'bg-red-900/70 border-red-700 text-red-50' : 'bg-slate-900/80 border-slate-700 text-white'}`}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
            <div style={{ minWidth:0 }}>
              {t.title && <div className="font-semibold truncate">{t.title}</div>}
              {t.description && <div className="text-xs opacity-80 mt-0.5 max-w-[280px] break-words">{t.description}</div>}
            </div>
            <button onClick={()=> dismiss(t.id)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
