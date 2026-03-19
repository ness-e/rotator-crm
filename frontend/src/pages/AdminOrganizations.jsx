/**
 * @file AdminOrganizations.jsx
 * @description Página de administración de organizaciones (clientes B2B) del sistema
 * 
 * @usage
 * - Dónde se utiliza: Ruta /admin/organizations en el router principal
 * - Cuándo se utiliza: Accesible para usuarios con rol SUPER_ADMIN o ADMIN
 * 
 * @functionality
 * - Listar todas las organizaciones con filtrado y búsqueda
 * - Crear nuevas organizaciones (clientes)
 * - Editar información de organizaciones existentes
 * - Eliminar organizaciones con confirmación
 * - Ver usuarios asociados a cada organización
 * - Ver licencias asociadas a cada organización
 * - Navegar a detalles de organización
 * 
 * @dependencies
 * - @tanstack/react-query - Gestión de estado del servidor
 * - @/components/ui/* - Componentes de UI (Table, Dialog, Form, etc)
 * - react-hook-form - Manejo de formularios
 * - zod - Validación de schemas
 * 
 * @relatedFiles
 * - backend/src/routes/crm.js - API de organizaciones (/api/crm/organizations)
 * - components/FilterBar.jsx - Barra de filtros
 * - components/DataTable.jsx - Tabla de datos
 * - components/ConfirmDialog.jsx - Diálogo de confirmación
 * 
 * @module Frontend Page
 * @category Admin
 * @path /frontend/src/pages/AdminOrganizations.jsx
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import React, { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Users, Receipt } from 'lucide-react';
import { FilterBar } from '@/components/FilterBar';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

// Schema
const orgSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
    taxId: z.string().optional(),
    countryCode: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    clientType: z.enum(['A', 'B', 'C', 'D']).default('C'),
    isMaster: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export default function AdminOrganizations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const nav = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Fetch
    const { data: orgs = [], isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await fetch('/api/crm/organizations', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Error loading organizations');
            return res.json();
        }
    });

    // Mutations
    const createOrg = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/crm/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['organizations']);
            setOpen(false);
            toast({ title: 'Organización creada' });
        }
    });

    const updateOrg = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await fetch(`/api/crm/organizations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['organizations']);
            setOpen(false);
            setEditing(null);
            toast({ title: 'Organización actualizada' });
        }
    });

    const form = useForm({
        resolver: zodResolver(orgSchema),
        defaultValues: {
            name: '', taxId: '', countryCode: '', city: '', address: '', clientType: 'C'
        }
    });

    const onSubmit = (values) => {
        if (editing) {
            updateOrg.mutate({ id: editing.id, data: values });
        } else {
            createOrg.mutate(values);
        }
    };

    const handleEdit = (row) => {
        setEditing(row);
        form.reset({
            name: row.name,
            taxId: row.taxId || '',
            countryCode: row.countryCode || '',
            city: row.city || '',
            address: row.address || '',
            clientType: row.clientType || 'C',
            email: row.email || '',
            password: '', // Never pre-fill password
            isMaster: row.isMaster || false,
            isActive: row.isActive !== false // Default to true
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditing(null);
        form.reset({
            name: '',
            taxId: '',
            countryCode: '',
            city: '',
            address: '',
            clientType: 'C',
            email: '',
            password: '',
            isMaster: false,
            isActive: true
        });
        setOpen(true);
    };

    // Delete Logic
    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/crm/organizations/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error deleting');

            toast({ title: 'Organización eliminada' });
            queryClient.invalidateQueries(['organizations']);
        } catch (e) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setDeleteId(null);
        }
    };

    // Filter
    const filtered = orgs.filter(o =>
        o.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        o.taxId?.includes(searchValue)
    );

    const columns = [
        {
            key: 'name', label: 'Organización', render: (v, r) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {v}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.countryCode} · {r.city}</div>
                </div>
            )
        },
        { key: 'clientType', label: 'Tipo', render: (v) => <StatusBadge label={`Tipo ${v}`} status={v === 'A' ? 'active' : 'info'} /> },
        {
            key: 'admin', label: 'Admin', render: (v, r) => (
                <div className="text-sm">
                    {r._count?.users || 0} Usuarios
                </div>
            )
        },
        {
            key: 'licenses', label: 'Licencias', render: (v, r) => (
                <div className="text-sm">
                    {r._count?.licenses || 0} Licencias
                </div>
            )
        },
        {
            key: 'actions', label: 'Acciones', render: (v, r) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Organizaciones</h1>
                    <p className="text-muted-foreground">Gestión centralizada de empresas y entidades.</p>
                </div>

                <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleNew} className="rounded-xl shadow-lg hover:scale-105 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Organización
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Editar Organización' : 'Nueva Organización'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="taxId" render={({ field }) => (
                                        <FormItem><FormLabel>ID Fiscal (RIF/NIT)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="clientType" render={({ field }) => (
                                        <FormItem><FormLabel>Tipo de Cliente</FormLabel><FormControl>
                                            <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3">
                                                <option value="A">Tipo A (Corporativo)</option>
                                                <option value="B">Tipo B (Empresa)</option>
                                                <option value="C">Tipo C (Pyme)</option>
                                                <option value="D">Tipo D (Otro)</option>
                                            </select>
                                        </FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="countryCode" render={({ field }) => (
                                        <FormItem><FormLabel>País (ISO)</FormLabel><FormControl><Input {...field} placeholder="VE, CO, US" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="city" render={({ field }) => (
                                        <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />

                                {/* Authentication Section */}
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Autenticación (Opcional)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="admin@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem><FormLabel>Contraseña {editing && '(vacío = no cambiar)'}</FormLabel><FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="flex gap-6 mt-3">
                                        <FormField control={form.control} name="isActive" render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
                                                <FormLabel className="!mt-0 cursor-pointer">Activa</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="isMaster" render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
                                                <FormLabel className="!mt-0 cursor-pointer">Es Master</FormLabel>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Guardar</Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl dark:bg-slate-900/50">
                <CardContent className="p-6">
                    <FilterBar searchValue={searchValue} onSearchChange={setSearchValue} />
                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={isLoading}
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => { if (!o) setDeleteId(null) }}
                title="¿Eliminar Organización?"
                description="Esta acción no se puede deshacer. Se verificará si existen usuarios o licencias asociados."
                onConfirm={confirmDelete}
            />
        </div>
    );
}
