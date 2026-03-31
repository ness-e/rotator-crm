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
import { useDebouncedValue } from '../utils/debounce';
import AdminGestionLayout from '@/components/AdminGestionLayout';

export default function AdminActivations() {
    const { toast } = useToast();

    // TanStack Query hook
    const { data: items = [], isLoading: loading, refetch: reload } = useActivations();

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const debouncedSearch = useDebouncedValue(searchValue, 300);


    // Edit/Create State
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    // Schema
    const schema = z.object({
        id: z.coerce.number().int().optional(),
        licenseId: z.coerce.number().int().min(1, 'ID de licencia requerido'),
        hardwareId: z.string().optional(),
        keyUsed: z.string().min(1, 'Clave requerida'),
        pcName: z.string().min(1, 'Nombre del PC requerido'),
        date: z.string().min(1, 'Fecha requerida')
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { id: '', licenseId: '', hardwareId: '', keyUsed: '', pcName: '', date: '' }
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
        const searchStr = debouncedSearch.toLowerCase()

        if (searchStr && ![
            String(item.id),
            String(item.licenseId),
            item.pcName,
            item.hardwareId,
            item.keyUsed,
            item.date
        ].some(val => String(val || '').toLowerCase().includes(searchStr))) {
            return false
        }

        return true
    })

    const isAll = String(pageSize) === 'all';
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filteredItems.length / Number(pageSize)));
    const currentPage = Math.min(page, totalPages);
    const start = isAll ? 0 : (currentPage - 1) * Number(pageSize);
    const pageItems = isAll ? filteredItems : filteredItems.slice(start, start + Number(pageSize));

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
            label: 'PC / Hardware ID',
            render: (v, row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{v}</span>
                    </div>
                    {row.hardwareId && (
                        <span className="text-xs text-muted-foreground ml-5 font-mono">{row.hardwareId}</span>
                    )}
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
                            hardwareId: row.hardwareId || '',
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
        <>
            <AdminGestionLayout
                title="Monitor de Activaciones"
                description="Supervisa las sesiones activas y gestiona el inventario de claves."
                icon={Activity}
                searchValue={searchValue}
                onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
                pageSize={pageSize}
                onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                onPageChange={setPage}
                searchPlaceholder="Buscar por ID, PC, Hardware ID, serial..."
                actions={
                    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); form.reset() } }}>
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
                                    <FormField control={form.control} name="hardwareId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hardware ID (Identificador de máquina)</FormLabel>
                                            <FormControl><Input {...field} placeholder="Ej: ABC123-DEF456" className="font-mono" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
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
                }
            >
                <DataTable
                    columns={columns}
                    data={pageItems}
                    rowKey="id"
                    sortable
                    loading={loading}
                    emptyState={
                        <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                            <Activity className="h-10 w-10 mb-2 opacity-20" />
                            <p>No se encontraron activaciones con los filtros actuales</p>
                        </div>
                    }
                />
            </AdminGestionLayout>

            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                title="¿Eliminar activación?"
                description={`Estás a punto de eliminar la activación ${deleteItem?.id} del PC "${deleteItem?.pcName}". Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                onConfirm={confirmDelete}
            />
        </>
    )
}
