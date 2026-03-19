/**
 * @file AdminActivations.jsx
 * @description Componente de página (Vista) para la sección AdminActivations.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminActivations.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { copyToClipboard } from '@/utils/copy';
import { DataTable } from '@/components/DataTable';
import { FilterBar } from '@/components/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Activity, Search, Monitor, Calendar, Key, Trash2, Edit, Plus, Copy } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useActivations } from '@/hooks/useApi';
import { api } from '@/utils/api'; // Ensure api is imported for CRUD

export default function AdminActivations() {
    const { toast } = useToast();

    // TanStack Query hook
    const { data: items = [], isLoading: loading, refetch: reload } = useActivations();

    // Custom Filters State
    const [filters, setFilters] = useState({
        global: '',
        licenseId: '',
        pc: '',
        dateFrom: '',
        dateTo: ''
    });

    // Edit/Create State
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    // Schema
    const schema = z.object({
        id: z.coerce.number().int().optional(),
        licenseId: z.coerce.number().int().min(1, 'ID de licencia requerido'),
        keyUsed: z.string().min(1, 'Clave requerida'),
        pcName: z.string().min(1, 'Nombre del PC requerido'),
        date: z.string().min(1, 'Fecha requerida')
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { id: '', licenseId: '', keyUsed: '', pcName: '', date: '' }
    });

    // Actions
    async function onSubmit(values) {
        const method = editing ? 'PUT' : 'POST'
        const url = editing ? `/activations/${editing.id}` : '/activations'
        // Ensure numbers for IDs
        const payload = {
            ...values,
            id: values.id ? Number(values.id) : undefined,
            licenseId: Number(values.licenseId)
        }

        const res = await (method === 'PUT' ? api.put(url, payload) : api.post(url, payload))

        if (!res.ok) {
            const e = await res.json().catch(() => ({ error: 'Error desconocido' }))
            toast({ title: 'Error', description: e.error, variant: 'destructive' })
            return
        }

        toast({ title: editing ? 'Activación actualizada' : 'Activación creada' })
        setOpen(false)
        setEditing(null)
        form.reset()
        reload()
    }

    function onDelete(row) {
        setDeleteItem(row)
    }

    async function confirmDelete() {
        if (!deleteItem) return

        try {
            const res = await api.delete(`/activations/${deleteItem.id}`)
            if (!res.ok) {
                toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
                return
            }
            toast({ title: 'Activación eliminada' })
            setItems(prev => prev.filter(i => i.id !== deleteItem.id))
        } catch (error) {
            console.error(error)
        } finally {
            setDeleteItem(null)
        }
    }

    // Filter Logic
    const filteredItems = items.filter(item => {
        // 1. Global Text Search
        const searchStr = filters.global.toLowerCase()
        if (searchStr && ![
            String(item.id),
            String(item.licenseId),
            item.pcName,
            item.keyUsed,
            item.date
        ].some(val => String(val || '').toLowerCase().includes(searchStr))) {
            return false
        }

        // 2. Exact License ID
        if (filters.licenseId && String(item.licenseId) !== filters.licenseId) return false

        // 3. Partial PC Name
        if (filters.pc && !String(item.pcName || '').toLowerCase().includes(filters.pc.toLowerCase())) return false

        // 4. Date Range
        if (item.date) {
            const date = String(item.date).slice(0, 10)
            if (filters.dateFrom && date < filters.dateFrom) return false
            if (filters.dateTo && date > filters.dateTo) return false
        }

        return true
    })

    // Columns
    const columns = [
        { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-muted-foreground">{v}</span> },
        {
            key: 'license',
            label: 'Licencia / Organización',
            render: (_, row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {row.license?.serialKey || `ID: ${row.licenseId}`}
                        </Badge>
                    </div>
                    {row.license?.organization?.name && (
                        <span className="text-xs text-muted-foreground mt-0.5 ml-1">{row.license.organization.name}</span>
                    )}
                </div>
            )
        },
        {
            key: 'pcName',
            label: 'PC / Dispositivo',
            render: (v) => (
                <div className="flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-sm">{v}</span>
                </div>
            )
        },
        {
            key: 'keyUsed',
            label: 'Clave Activación',
            render: (v) => (
                <div className="flex items-center gap-1 group">
                    <code className="text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{v}</code>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(v, toast)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            )
        },
        {
            key: 'date',
            label: 'Fecha',
            render: (v) => <span className="text-xs text-muted-foreground">{v ? new Date(v).toLocaleString() : '-'}</span>
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                        setEditing(row)
                        // Prefill form
                        form.reset({
                            id: row.id,
                            licenseId: row.licenseId,
                            keyUsed: row.keyUsed,
                            pcName: row.pcName,
                            date: row.date ? new Date(row.date).toISOString().slice(0, 16) : ''
                        })
                        setOpen(true)
                    }}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(row)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Monitor de Activaciones</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Supervisa las sesiones activas y gestiona el inventario de claves.</p>
                </div>
                <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); form.reset() } }}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-5 w-5" /> Nueva Activación
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Editar Activación' : 'Nueva Activación Manual'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {!editing && (
                                    <FormField control={form.control} name="id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ID (Opcional)</FormLabel>
                                            <FormControl><Input {...field} type="number" placeholder="Automático" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="licenseId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ID Licencia</FormLabel>
                                            <FormControl><Input {...field} type="number" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="pcName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre PC</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="keyUsed" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Clave Amarilla (Serial de PC)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha y Hora</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="datetime-local" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <DialogFooter>
                                    <Button type="submit">{editing ? 'Guardar Cambios' : 'Crear Activación'}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="md:col-span-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Filtros de Búsqueda
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar global..."
                        className="pl-9 bg-background"
                        value={filters.global}
                        onChange={(e) => setFilters(prev => ({ ...prev, global: e.target.value }))}
                    />
                </div>
                <div className="relative">
                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ID Licencia"
                        className="pl-9 bg-background"
                        type="number"
                        value={filters.licenseId}
                        onChange={(e) => setFilters(prev => ({ ...prev, licenseId: e.target.value }))}
                    />
                </div>
                <div className="relative">
                    <Monitor className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Nombre PC"
                        className="pl-9 bg-background"
                        value={filters.pc}
                        onChange={(e) => setFilters(prev => ({ ...prev, pc: e.target.value }))}
                    />
                </div>
                <div className="flex gap-2">
                    <Input
                        type="date"
                        className="bg-background"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                    <Input
                        type="date"
                        className="bg-background"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                </div>
            </div>

            {/* Data Table */}
            <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden border-none">
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        rowKey="id"
                        sortable
                        emptyState={
                            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                                <Activity className="h-10 w-10 mb-2 opacity-20" />
                                <p>No se encontraron activaciones con los filtros actuales</p>
                            </div>
                        }
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                title="¿Eliminar activación?"
                description={`Estás a punto de eliminar la activación ${deleteItem?.id} del PC "${deleteItem?.pcName}". Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                onConfirm={confirmDelete}
            />
        </div>
    )
}
