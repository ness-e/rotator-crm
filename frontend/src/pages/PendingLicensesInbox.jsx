import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { DataTable } from '@/components/DataTable'
import { AdminGestionLayout } from '@/components/AdminGestionLayout'
import { Inbox, Trash2, RefreshCw } from 'lucide-react'
import { api } from '../utils/api'
import { useDebouncedValue } from '../utils/debounce'

export default function PendingLicensesInbox() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const debouncedQuery = useDebouncedValue(query, 300)

  async function reload() {
    setLoading(true)
    try {
      const res = await api.get('/invitations')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Error al cargar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])
  
  // Reset page on search change
  useEffect(() => { setPage(1) }, [debouncedQuery])

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim()
    if (!q) return items
    return items.filter(a =>
      (a.email || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q) ||
      (a.productTemplate?.version_nombre || '').toLowerCase().includes(q) ||
      (a.id || '').toLowerCase().includes(q)
    )
  }, [items, debouncedQuery])

  const isAll = String(pageSize) === 'all'
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)))
  const currentPage = Math.min(page, totalPages)
  const start = isAll ? 0 : (currentPage - 1) * Number(pageSize)
  const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize))

  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar la invitación para "${item.email}"?`)) return
    try {
      const res = await api.delete(`/invitations/${item.id}`)
      if (res.ok) {
        setItems(prev => prev.filter(x => x.id !== item.id))
        toast({ title: 'Invitación eliminada' })
      } else {
        throw new Error('No se pudo eliminar la invitación')
      }
    } catch (e) {
      toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AdminGestionLayout
      title="Invitaciones Pendientes"
      description="Bandeja de invitaciones enviadas y solicitudes pendientes de procesar."
      icon={Inbox}
      onRefresh={reload}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Buscar por correo, plan o ID..."
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={filtered.length}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    >
      <DataTable
        loading={loading}
        columns={[
          { 
            key: 'status', 
            label: 'Estado', 
            render: (v) => (
              <Badge variant={v === 'PENDING' ? 'outline' : 'secondary'} className="font-mono text-xs px-2 py-0">
                {v === 'PENDING' ? 'Pendiente' : v}
              </Badge>
            )
          },
          { key: 'email', label: 'Correo Invitado', render: (v) => <span className="font-medium">{v}</span> },
          { 
            key: 'productTemplate', 
            label: 'Plan Asignado', 
            render: (v) => (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {v?.version_nombre || v?.name || 'N/A'}
              </span>
            )
          },
          { 
            key: 'createdAt', 
            label: 'Fecha Creación', 
            render: (v) => (
              <span className="text-xs text-muted-foreground">
                {v ? new Date(v).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>
            )
          },
          {
            key: 'actions',
            label: '',
            render: (_, row) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
        data={pageItems}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-4 opacity-10" />
            <p className="font-medium">{debouncedQuery ? 'Sin resultados para la búsqueda.' : 'No hay invitaciones pendientes.'}</p>
          </div>
        }
      />
    </AdminGestionLayout>
  )
}
