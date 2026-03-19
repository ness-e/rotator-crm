/**
 * @file AdminAudit.jsx
 * @description Componente de página (Vista) para la sección AdminAudit.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminAudit.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Calendar, User, Search, Fingerprint } from 'lucide-react'
import { api } from '@/utils/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminAudit() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        loadLogs()
    }, [page])

    const loadLogs = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/audit?page=${page}&limit=50`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.data)
                setTotalPages(data.pagination.pages)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE':
            case 'CREAR':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'UPDATE':
            case 'MODIFICAR':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'DELETE':
            case 'ELIMINAR':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
            case 'LOGIN':
            case 'SESIÓN INICIADA':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'REGENERATE':
            case 'REGENERAR CLAVE':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            default:
                return 'bg-slate-100 text-slate-800'
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground mt-1">Registro de actividad y seguridad del sistema.</p>
                </div>
                <Button variant="outline" onClick={loadLogs}>Refrescar</Button>
            </div>

            <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Fecha</TableHead>
                                <TableHead>Usuario (Actor)</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Entidad</TableHead>
                                <TableHead>Detalles</TableHead>
                                <TableHead className="text-right">IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Cargando registros...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No hay registros de auditoría.</TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {format(new Date(log.fecha), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.usuario_nombre || log.usuario_email || 'Sistema'}</span>
                                                <span className="text-xs text-muted-foreground">{log.usuario_email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`border-0 ${getActionColor(log.accion)}`}>
                                                {log.accion}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium">{log.entidad_nombre || log.entidad_id}</span>
                                                <span className="text-xs text-muted-foreground uppercase">{log.entidad}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] text-sm text-muted-foreground whitespace-pre-wrap">
                                            {log.detalles}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                            <span className="flex items-center justify-end gap-1 text-slate-500">
                                                <Fingerprint className="h-3 w-3" /> {log.ip}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button>
                </div>
            </div>
        </div>
    )
}
