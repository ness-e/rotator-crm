/**
 * @file AdminOrganizations.jsx
 * @description Página de administración de organizaciones (clientes B2B) del sistema
 * 
 * @usage
 * - Dónde se utiliza: Ruta /admin/organizations en el router principal
 * - Cuándo se utiliza: Accesible para usuarios con rol MASTER o ANALISTA
 * 
 * @functionality
 * - Listar todas las organizaciones con filtrado y búsqueda por nombre, RIF y estado
 * - Crear nuevas organizaciones (clientes) con campos detallados de negocio y contactos
 * - Editar información de organizaciones existentes
 * - Eliminar organizaciones con confirmación
 * - Seleccionar país y ciudad dinámicamente usando selectores asíncronos
 * - Asignar Primer Contacto a través del catálogo de usuarios Master
 * - Ver usuarios y licencias asociadas a cada organización
 * 
 * @dependencies
 * - @tanstack/react-query - Gestión de estado del servidor
 * - @/components/ui/* - Componentes de UI (Table, Dialog, Form, Popover, Command, etc)
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
 * @lastUpdated 2026-03-23
 * @author Sistema
 */

import React, { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Users, Receipt, Check, ChevronsUpDown, Phone, Globe, Briefcase, Mail, Clock, XCircle, Send, ShoppingCart, CheckCircle2, Sparkles } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { AdminGestionLayout } from '@/components/AdminGestionLayout';
import { useDebouncedValue } from '../utils/debounce';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { GlobalPhoneInput } from '@/components/GlobalSelects';

const EntityStatusBadge = ({ status }) => {
    switch (status) {
        case 'En proceso':
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#0088cc] text-white"><Clock className="w-3.5 h-3.5" /> ESTÁ EN PROCESO</span>;
        case 'No renovo':
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#ff0000] text-white"><XCircle className="w-3.5 h-3.5" /> NO RENOVÓ</span>;
        case 'Correo enviado':
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#e6c8c8] text-rose-900 border border-rose-200"><Send className="w-3.5 h-3.5" /> CORREO ENVIADO</span>;
        case 'Compro por la pagina':
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#f0d8a8] text-amber-900 border border-amber-200"><ShoppingCart className="w-3.5 h-3.5" /> COMPRARON POR LA PAGINA</span>;
        case 'Renovo':
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#dcf0d2] text-green-900 border border-green-200"><CheckCircle2 className="w-3.5 h-3.5" /> RENOVÓ</span>;
        case 'Nuevo':
        default:
            return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#00b050] text-white"><Sparkles className="w-3.5 h-3.5" /> CLIENTE NUEVO</span>;
    }
};
// Schema modificado para abarcar todos los campos nuevos
const orgSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
    taxId: z.string().optional(),
    countryCode: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    clientType: z.string().default('C'),
    notes: z.string().optional().nullable(),
    isMaster: z.boolean().optional(),
    isActive: z.boolean().optional(),
    phone: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    marketTargetId: z.number().optional().nullable(),
    ejecutivoId: z.number().optional().nullable(),
    language: z.string().optional().nullable(),
    adminContactName: z.string().optional().nullable(),
    adminContactLastName: z.string().optional().nullable(),
    adminContactEmail: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
    useContactName: z.string().optional().nullable(),
    useContactLastName: z.string().optional().nullable(),
    useContactEmail: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
    businessType: z.string().optional().nullable(),
    status: z.string().optional(),
    primerContactoId: z.number().optional().nullable()
});

// Helper component for Searchable Comboboxes
function SearchableCombobox({ items, value, onChange, placeholder, searchPlaceholder, emptyMessage }) {
    const [open, setOpen] = useState(false)
    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-10 px-3 bg-background font-normal">
                    {value ? items.find((item) => item.value === value)?.label : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 z-[100] pointer-events-auto" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onChange(item.value === value ? "" : item.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function AdminOrganizations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const nav = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const debouncedSearch = useDebouncedValue(searchValue, 300);


    // Queries
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

    const { data: countries = [] } = useQuery({
        queryKey: ['locations_countries'],
        queryFn: async () => {
            const res = await fetch('/api/locations/countries');
            if (res.ok) return res.json();
            return [];
        }
    });

    const { data: usersData = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (res.ok) return res.json();
            return [];
        }
    });

    const { data: licenseVersions = [] } = useQuery({
        queryKey: ['license_templates'],
        queryFn: async () => {
            const res = await fetch('/api/catalog/license-versions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (res.ok) return res.json();
            return [];
        }
    });

    // Options derived from queries
    const countryOptions = countries.map(c => ({ value: c.isoCode, label: `${c.name} (${c.isoCode})` }));
    const masterUsers = usersData.filter(u => u.role === 'MASTER' || u.tipo === 'MASTER').map(u => ({ value: u.id, label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email }));

    // Mutations
    const createOrg = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/crm/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
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
            name: '', taxId: '', countryCode: '', city: '', address: '', clientType: 'C', notes: '', status: 'Nuevo',
            phone: '', source: '', marketTargetId: null, ejecutivoId: null, language: '',
            adminContactName: '', adminContactLastName: '', adminContactEmail: '',
            useContactName: '', useContactLastName: '', useContactEmail: '',
            businessType: '', primerContactoId: null
        }
    });

    const inviteForm = useForm({
        resolver: zodResolver(z.object({
            email: z.string().email('Email requerido para la invitación'),
            productTemplateId: z.string().min(1, 'Seleccione un plan de licencia')
        })),
        defaultValues: { email: '', productTemplateId: '' }
    });

    const createInvitation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ email: data.email, productTemplateId: Number(data.productTemplateId) })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Fallo al procesar invitación');
            return json;
        },
        onSuccess: (data) => {
            setInviteOpen(false);
            inviteForm.reset();
            toast({ title: 'Invitación enviada con éxito', description: `Se ha enviado el enlace a ${data.invitation.email}` });
        },
        onError: (e) => {
            toast({ title: 'Error al enviar invitación', description: e.message, variant: 'destructive' });
        }
    });

    const onInviteSubmit = (values) => {
        createInvitation.mutate(values);
    };

    const selectedCountry = form.watch('countryCode');

    const { data: cities = [] } = useQuery({
        queryKey: ['locations_cities', selectedCountry],
        queryFn: async () => {
            if (!selectedCountry) return [];
            const res = await fetch(`/api/locations/cities/${selectedCountry}`);
            if (res.ok) return res.json();
            return [];
        },
        enabled: !!selectedCountry
    });
    const cityOptions = cities.map(c => ({ value: c.name, label: `${c.name}, ${c.stateCode}` }));

    const onSubmit = (values) => {
        // Remove empty numeric values if any
        if (values.primerContactoId === '') values.primerContactoId = null;
        if (values.ejecutivoId === '') values.ejecutivoId = null;
        if (values.marketTargetId === '') values.marketTargetId = null;

        if (editing) {
            updateOrg.mutate({ id: editing.id, data: values });
        } else {
            createOrg.mutate(values);
        }
    };

    const handleEdit = (row) => {
        setEditing(row);
        form.reset({
            name: row.name || '',
            taxId: row.taxId || '',
            countryCode: row.countryCode || '',
            city: row.city || '',
            address: row.address || '',
            clientType: row.clientType || 'C',
            notes: row.notes || '',
            email: row.email || '',
            password: '', // Never pre-fill password
            isMaster: row.isMaster || false,
            isActive: row.isActive !== false,
            phone: row.phone || '',
            source: row.source || '',
            marketTargetId: row.marketTargetId || null,
            ejecutivoId: row.ejecutivoId || null,
            language: row.language || '',
            adminContactName: row.adminContactName || '',
            adminContactLastName: row.adminContactLastName || '',
            adminContactEmail: row.adminContactEmail || '',
            useContactName: row.useContactName || '',
            useContactLastName: row.useContactLastName || '',
            useContactEmail: row.useContactEmail || '',
            businessType: row.businessType || '',
            status: row.status || 'Nuevo',
            primerContactoId: row.primerContactoId || null
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditing(null);
        form.reset({
            name: '', taxId: '', countryCode: '', city: '', address: '', clientType: 'C', notes: '', status: 'Nuevo',
            email: '', password: '', isMaster: false, isActive: true, phone: '', source: '', marketTargetId: null,
            ejecutivoId: null, language: 'es', adminContactName: '', adminContactLastName: '', adminContactEmail: '',
            useContactName: '', useContactLastName: '', useContactEmail: '', businessType: '', primerContactoId: null
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
    const filtered = orgs.filter(o => {
        const q = debouncedSearch.toLowerCase().trim();
        return o.name.toLowerCase().includes(q) ||
               o.taxId?.includes(q) ||
               o.status?.toLowerCase().includes(q);
    });

    const isAll = String(pageSize) === 'all';
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
    const currentPage = Math.min(page, totalPages);
    const start = isAll ? 0 : (currentPage - 1) * Number(pageSize);
    const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize));


    const columns = [
        {
            key: 'name', label: 'Organización', render: (v, r) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {v}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-1 items-center mt-1">
                        <Globe className="h-3 w-3" /> {r.countryCode || 'XX'} · {r.city || 'Sin ciudad'}
                    </div>
                </div>
            )
        },
        { 
            key: 'status', label: 'Estado', render: (v, r) => (
                <div className="flex flex-col items-start">
                    <EntityStatusBadge status={r.status || 'Nuevo'} />
                </div>
            ) 
        },
        {
            key: 'clientType', label: 'Título', render: (v, r) => (
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md w-8 h-8 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {r.clientType || 'C'}
                </div>
            )
        },
        {
            key: 'contacts', label: 'Contacto Principal', render: (v, r) => (
                <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {r.adminContactName ? `${r.adminContactName} ${r.adminContactLastName || ''}`.trim() : 'N/A'}</div>
                    <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {r.adminContactEmail || r.email || 'N/A'}</div>
                </div>
            )
        },
        {
            key: 'useContacts', label: 'Contacto de Uso', render: (v, r) => (
                <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1"><Users className="h-3 w-3 text-cyan-500" /> {r.useContactName ? `${r.useContactName} ${r.useContactLastName || ''}`.trim() : 'N/A'}</div>
                    <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {r.useContactEmail || 'N/A'}</div>
                </div>
            )
        },
        {
            key: 'usage', label: 'Uso', render: (v, r) => (
                <div className="text-xs">
                    <div>Usr: <b>{r._count?.users || 0}</b></div>
                    <div>Lic: <b>{r._count?.licenses || 0}</b></div>
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
        <>
            <AdminGestionLayout
                title="Organizaciones"
                description="Gestión completa de entidades B2B y prospectos corporativos."
                icon={Building2}
                searchValue={searchValue}
                onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
                pageSize={pageSize}
                onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                onPageChange={setPage}
                searchPlaceholder="Buscar por nombre, RIF o estado..."
                actions={
                    <div className="flex items-center gap-3">
                        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-xl shadow-sm hover:scale-105 transition-all text-primary border-primary">
                                    <Send className="mr-2 h-4 w-4" /> Invitar Cliente por Email
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Send className="h-5 w-5 text-primary" /> Invitar Nuevo Cliente
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Formulario para enviar invitación
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...inviteForm}>
                                    <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4 pt-4">
                                        <FormField control={inviteForm.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Correo Electrónico (Para envío del link)</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="cliente@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={inviteForm.control} name="productTemplateId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plan de Licencia (*)</FormLabel>
                                                <FormControl>
                                                    <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                                        <option value="">Seleccione un plan de licencia...</option>
                                                        {licenseVersions.filter(v => v._isActive !== false).map(v => (
                                                            <option key={v._templateId || v.id_version} value={v._templateId || v.id_version}>{v.version_nombre || v.name} - ${v.price_annual || 0}/año</option>
                                                        ))}
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                                            <Button type="submit" disabled={createInvitation.isPending}>
                                                {createInvitation.isPending ? 'Generando...' : 'Generar y Enviar Link'}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
                            <DialogTrigger asChild>
                                <Button onClick={handleNew} className="rounded-xl shadow-lg hover:scale-105 transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> Alta Manual
                                </Button>
                            </DialogTrigger>
                            <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                                <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        <Building2 className="h-6 w-6 text-primary" />
                                        {editing ? 'Editar Organización' : 'Alta Manual (Organización)'}
                                    </DialogTitle>
                                </DialogHeader>
                                
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0">
                                        <ScrollArea className="flex-1 p-6 h-[60vh]" style={{ overflow: 'auto' }}>
                                            <div className="space-y-8 pr-4">
                                                
                                                {/* SECCIÓN 1: DATOS GENERALES */}
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2"><Briefcase className="h-4 w-4" /> Datos Generales</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="name" render={({ field }) => (
                                                            <FormItem><FormLabel>Nombre de Entidad *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="taxId" render={({ field }) => (
                                                            <FormItem><FormLabel>ID Fiscal (RIF/NIT/CIF)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="businessType" render={({ field }) => (
                                                            <FormItem><FormLabel>Tipo de Negocio</FormLabel><FormControl><Input placeholder="Ej. Agencia de Investigación, Manufactura..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="status" render={({ field }) => (
                                                            <FormItem><FormLabel>Status Operativo</FormLabel><FormControl>
                                                                <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">
                                                                    <option value="Nuevo">Nuevo</option>
                                                                    <option value="En proceso">En proceso</option>
                                                                    <option value="Correo enviado">Correo enviado</option>
                                                                    <option value="Compro por la pagina">Compró por la página</option>
                                                                    <option value="Renovo">Renovó</option>
                                                                    <option value="No renovo">No renovó</option>
                                                                </select>
                                                            </FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                </div>

                                                {/* SECCIÓN 2: UBICACIÓN */}
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2"><Globe className="h-4 w-4" /> Ubicación Dinámica</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="countryCode" render={({ field }) => (
                                                            <FormItem className="flex flex-col justify-end">
                                                                <FormLabel>País *</FormLabel>
                                                                <FormControl>
                                                                    <SearchableCombobox 
                                                                        items={countryOptions}
                                                                        value={field.value}
                                                                        onChange={(val) => {
                                                                            field.onChange(val);
                                                                            // Reset city when country changes
                                                                            form.setValue('city', '');
                                                                        }}
                                                                        placeholder="Seleccione País..."
                                                                        searchPlaceholder="Buscar País..."
                                                                        emptyMessage="No encontrado."
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="city" render={({ field }) => (
                                                            <FormItem className="flex flex-col justify-end">
                                                                <FormLabel>Ciudad / Región</FormLabel>
                                                                <FormControl>
                                                                    <SearchableCombobox 
                                                                        items={cityOptions}
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        placeholder={selectedCountry ? "Seleccione Ciudad..." : "Elija País primero"}
                                                                        searchPlaceholder="Buscar Ciudad..."
                                                                        emptyMessage={selectedCountry ? "Buscando..." : "Esperando país."}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="address" render={({ field }) => (
                                                            <FormItem className="md:col-span-2"><FormLabel>Dirección Física</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                </div>

                                                {/* SECCIÓN 3: CONTACTOS */}
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2"><Users className="h-4 w-4" /> Directores y Contactos</h3>
                                                    
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed space-y-4">
                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase">Contacto Administrativo (Compras/Pagos)</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField control={form.control} name="adminContactName" render={({ field }) => (
                                                                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="adminContactLastName" render={({ field }) => (
                                                                <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="adminContactEmail" render={({ field }) => (
                                                                <FormItem><FormLabel>Correo Admon.</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed space-y-4">
                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase">Contacto de Uso (Operador/Líder)</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField control={form.control} name="useContactName" render={({ field }) => (
                                                                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="useContactLastName" render={({ field }) => (
                                                                <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="useContactEmail" render={({ field }) => (
                                                                <FormItem><FormLabel>Correo Operativo</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                        <FormField control={form.control} name="phone" render={({ field }) => (
                                                            <FormItem><FormLabel>Teléfono Fijo / General</FormLabel><FormControl><GlobalPhoneInput {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                        )} />

                                                        <FormField control={form.control} name="primerContactoId" render={({ field }) => (
                                                            <FormItem className="flex flex-col justify-end">
                                                                <FormLabel>Primer Contacto Interno (Rotator)</FormLabel>
                                                                <FormControl>
                                                                    <SearchableCombobox 
                                                                        items={masterUsers}
                                                                        value={field.value || ''}
                                                                        onChange={(v) => field.onChange(v ? Number(v) : null)}
                                                                        placeholder="Asignar Master..."
                                                                        searchPlaceholder="Buscar Empleado..."
                                                                        emptyMessage="Sin empleados."
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                </div>

                                                {/* SECCIÓN 4: COMPRAS Y CRM */}
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2"><Receipt className="h-4 w-4" /> Clasificación y Seguimiento</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <FormField control={form.control} name="clientType" render={({ field }) => (
                                                            <FormItem><FormLabel>Cod. Clasificación</FormLabel><FormControl>
                                                                <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">
                                                                    <option value="A">Tipo A (Corporativo VIP)</option>
                                                                    <option value="B">Tipo B (Empresa Mediana)</option>
                                                                    <option value="C">Tipo C (Pyme)</option>
                                                                    <option value="D">Tipo D (Micro/Otro)</option>
                                                                </select>
                                                            </FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="source" render={({ field }) => (
                                                            <FormItem><FormLabel>Origen / Medio</FormLabel><FormControl><Input placeholder="Google, Referido, Feria..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="language" render={({ field }) => (
                                                            <FormItem><FormLabel>Idioma Preferido</FormLabel><FormControl>
                                                                <select {...field} value={field.value || 'es'} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">
                                                                    <option value="es">Español</option>
                                                                    <option value="en">Inglés</option>
                                                                    <option value="pt">Portugués</option>
                                                                </select>
                                                            </FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <FormField control={form.control} name="notes" render={({ field }) => (
                                                        <FormItem><FormLabel>Bitácora Inicial / Notas</FormLabel><FormControl><textarea {...field} value={field.value || ''} rows={3} placeholder="Condiciones, acuerdos o descripción histórica..." className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>

                                            </div>
                                        </ScrollArea>
                                        
                                        <div className="p-4 border-t bg-muted/20 flex justify-between items-center rounded-b-lg">
                                            <div className="flex gap-4 items-center pl-2">
                                                <FormField control={form.control} name="isActive" render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0 text-sm font-medium">
                                                        <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-primary" /></FormControl>
                                                        <FormLabel className="!mt-0 cursor-pointer">Activa</FormLabel>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="isMaster" render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0 text-sm font-medium">
                                                        <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-amber-500" /></FormControl>
                                                        <FormLabel className="!mt-0 cursor-pointer text-amber-600">Es Master</FormLabel>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                                <Button type="submit" className="min-w-[120px] shadow-md">{editing ? 'Actualizar Ficha' : 'Dar de Alta'}</Button>
                                            </div>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            >
                <DataTable columns={columns} data={pageItems} loading={isLoading} />
            </AdminGestionLayout>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => { if (!o) setDeleteId(null) }}
                title="¿Eliminar Organización?"
                description="Esta acción no se puede deshacer. Se verificará si existen usuarios o licencias asociados."
                onConfirm={confirmDelete}
            />
        </>
    );

}
