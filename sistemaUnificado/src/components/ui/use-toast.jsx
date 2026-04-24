/**
 * @file use-toast.jsx
 * @description Componente reutilizable de UI: use-toast.
 * @module Frontend Component
 * @path /frontend/src/components/ui/use-toast.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react'

const listeners = new Set()
let idSeq = 1
let queue = []

export function useToast(){
  const notify = React.useCallback((t)=>{
    const item = {
      id: idSeq++,
      title: t?.title || '',
      description: t?.description || '',
      variant: t?.variant || 'default',
      duration: typeof t?.duration === 'number' ? t.duration : 2500,
    }
    queue = [...queue, item]
    listeners.forEach(l => l(queue))
    if(item.duration > 0){
      setTimeout(()=> dismiss(item.id), item.duration)
    }
  },[])
  return { toast: notify }
}

export function subscribeToasts(fn){
  listeners.add(fn)
  fn(queue)
  return () => listeners.delete(fn)
}

export function dismiss(id){
  queue = queue.filter(t => t.id !== id)
  listeners.forEach(l => l(queue))
}
