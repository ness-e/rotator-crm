import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/DataTable'
import { AdminGestionLayout } from '@/components/AdminGestionLayout'
import { ShieldCheck, Fingerprint } from 'lucide-react'
import { api } from '@/utils/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDebouncedValue } from '../utils/debounce'

export default function AdminAudit() {
    const { t } = useTranslation()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(50)

    const debouncedQuery = useDebouncedValue(query, 300)

    const loadLogs = async () => {
        setLoading(true)
        try {
            // Fetching a large limit to allow client-side filtering to match other pages
            const res = await api.get('/audit?limit=2500')
            if (res.ok) {
                const data = await res.json()
                setLogs(data.data || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLogs()
    }, [])

    useEffect(() => { setPage(1) }, [debouncedQuery])

    const getActionColor = (action) => {
        switch (action) {
            case 'CREAR':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'MODIFICAR':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'ELIMINAR':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
            case 'SESIÓN INICIADA':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'REGENERAR CLAVE':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            default:
                return 'bg-slate-100 text-slate-800'
        }
    }

    const filtered = useMemo(() => {
        const q = debouncedQuery.toLowerCase().trim()
        if (!q) return logs
        return logs.filter(l =>
            (l.action || '').toLowerCase().includes(q) ||
            (l.userName || '').toLowerCase().includes(q) ||
            (l.userEmail || '').toLowerCase().includes(q) ||
            (l.entityName || '').toLowerCase().includes(q) ||
            (l.details || '').toLowerCase().includes(q) ||
            (l.ip || '').toLowerCase().includes(q)
        )
    }, [logs, debouncedQuery])

    const isAll = String(pageSize) === 'all'
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)))
    const currentPage = Math.min(page, totalPages)
    const start = isAll ? 0 : (currentPage - 1) * Number(pageSize)
    const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize))

    return (
        <AdminGestionLayout
            title={t('audit.title')}
            description={t('audit.description')}
            icon={ShieldCheck}
            onRefresh={loadLogs}
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={t('audit.searchPlaceholder')}
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
                        key: 'createdAt',
                        label: t('audit.table.date'),
                        render: (v) => (
                            <span className="font-mono text-xs text-muted-foreground">
                                {v ? format(new Date(v), 'dd MMM yyyy HH:mm:ss', { locale: es }) : '—'}
                            </span>
                        )
                    },
                    {
                        key: 'user',
                        label: t('audit.table.user'),
                        render: (_, row) => (
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{row.userName || row.userEmail || t('audit.systemUser')}</span>
                                {row.userEmail && <span className="text-xs text-muted-foreground">{row.userEmail}</span>}
                            </div>
                        )
                    },
                    {
                        key: 'action',
                        label: t('audit.table.action'),
                        render: (v) => (
                            <Badge variant="outline" className={`border-0 ${getActionColor(v)}`}>
                                {v}
                            </Badge>
                        )
                    },
                    {
                        key: 'entity',
                        label: t('audit.table.entity'),
                        render: (_, row) => (
                            <div className="flex flex-col text-sm">
                                <span className="font-medium">{row.entityName || row.entityId}</span>
                                <span className="text-xs text-muted-foreground uppercase">{row.entity}</span>
                            </div>
                        )
                    },
                    {
                        key: 'details',
                        label: t('audit.table.details'),
                        render: (v) => (
                            <div className="max-w-[300px] text-sm text-muted-foreground whitespace-pre-wrap">
                                {v}
                            </div>
                        )
                    },
                    {
                        key: 'ip',
                        label: 'IP',
                        render: (v) => (
                            <div className="text-right font-mono text-xs">
                                <span className="flex items-center justify-end gap-1 text-slate-500">
                                    <Fingerprint className="h-3 w-3" /> {v}
                                </span>
                            </div>
                        )
                    }
                ]}
                data={pageItems}
                emptyState={
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mb-4 opacity-10" />
                        <p className="font-medium">{debouncedQuery ? t('audit.noResults') : t('audit.emptyState')}</p>
                    </div>
                }
            />
        </AdminGestionLayout>
    )
}
