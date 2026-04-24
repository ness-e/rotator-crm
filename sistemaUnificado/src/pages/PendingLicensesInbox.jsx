import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { DataTable } from '@/components/DataTable'
import { AdminGestionLayout } from '@/components/AdminGestionLayout'
import { Inbox, Trash2} from 'lucide-react'
import { api } from '../utils/api'
import { useDebouncedValue } from '../utils/debounce'
import { useTranslation } from 'react-i18next'

export default function PendingLicensesInbox() {
  const { t } = useTranslation()
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
      toast({ title: t('common.error'), description: e.message || t('common.errors.loadError'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])
  
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
    if (!window.confirm(t('common.confirmDelete', { name: item.email }))) return
    try {
      const res = await api.delete(`/invitations/${item.id}`)
      if (res.ok) {
        setItems(prev => prev.filter(x => x.id !== item.id))
        toast({ title: t('organizations.toast.invitationDeleted') })
      } else {
        throw new Error('Error deleting invitation')
      }
    } catch (e) {
      toast({ title: t('common.errors.deleteError'), description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AdminGestionLayout
      title={t('navigation.invitations')}
      description={t('organizations.invitations.description')}
      icon={Inbox}
      onRefresh={reload}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t('common.searchPlaceholder')}
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
            label: t('common.status'), 
            render: (v) => (
              <Badge variant={v === 'PENDING' ? 'outline' : 'secondary'} className="font-mono text-xs px-2 py-0">
                {v === 'PENDING' ? t('common.pending') : v}
              </Badge>
            )
          },
          { key: 'email', label: t('common.email'), render: (v) => <span className="font-medium">{v}</span> },
          { 
            key: 'productTemplate', 
            label: t('plans.versions.title'), 
            render: (v) => (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {v?.version_nombre || v?.name || 'N/A'}
              </span>
            )
          },
          { 
            key: 'createdAt', 
            label: t('common.creationDate'), 
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
            <p className="font-medium">{debouncedQuery ? t('common.noResults') : t('common.noInvitations')}</p>
          </div>
        }
      />
    </AdminGestionLayout>
  )
}