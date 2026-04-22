/**
 * @file AdminProspects.jsx
 * @description Página de gestión de prospectos con pipeline CRM dinámico tipo Kanban
 * 
 * @usage
 * - Dónde se utiliza: Ruta /crm/prospects en el router principal
 * - Cuándo se utiliza: Gestión de pipeline de ventas y seguimiento de prospectos
 * 
 * @functionality
 * - Vista Kanban con etapas dinámicas del pipeline (cargadas desde BD)
 * - Crear nuevos prospectos
 * - Editar información de prospectos existentes
 * - Eliminar prospectos con confirmación
 * - Filtrar prospectos por búsqueda
 * - Ver detalles de prospecto en modal
 * - Mover prospectos entre etapas del pipeline (drag & drop futuro)
 * - Convertir prospecto a cliente (futuro)
 * 
 * @dependencies
 * - @tanstack/react-query - Gestión de estado del servidor
 * - @/components/ui/* - Componentes de UI
 * - react-hook-form - Manejo de formularios
 * - zod - Validación de schemas
 * 
 * @relatedFiles
 * - backend/src/routes/prospects.js - API de prospectos
 * - backend/src/routes/catalog.js - API de pipeline stages (/api/catalog/pipeline-stages)
 * - components/PipelineColumn.jsx - Columna del Kanban
 * - hooks/useProspects.js - Hook de gestión de prospectos
 * 
 * @module Frontend Page
 * @category CRM
 * @path /frontend/src/pages/AdminProspects.jsx
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Globe,  Edit,  Phone, GitMerge } from 'lucide-react';
import { useProspects, useCreateProspect, useUpdateProspect, useDeleteProspect } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { GlobalPhoneInput } from '@/components/GlobalSelects';

const PIPELINE_STAGES = [
    { id: 'NUEVO', label: 'Nuevo', color: 'bg-slate-100 dark:bg-slate-900' },
    { id: 'CONTACTADO', label: 'Contactado', color: 'bg-blue-100 dark:bg-blue-900' },
    { id: 'INTERESADO', label: 'Interesado', color: 'bg-amber-100 dark:bg-amber-900' },
    { id: 'CLIENTE', label: 'Cliente', color: 'bg-green-100 dark:bg-green-900' },
    { id: 'PERDIDO', label: 'Perdido', color: 'bg-red-100 dark:bg-red-900' }
];

function ProspectCard({ prospect, onClick, onEdit }) {
    // Interest Level: 0-33 Low, 34-66 Medium, 67-100 High
    const level = prospect.interestLevel || 50;
    const interesColor = level > 66 ? 'bg-red-500' : level > 33 ? 'bg-amber-500' : 'bg-green-500';

    return (
        <Card
            className="mb-3 cursor-pointer hover:shadow-md transition-shadow relative group"
            onClick={() => onClick(prospect)}
        >
            <CardContent className="p-4">
                {/* Actions on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/80 dark:bg-black/50 rounded p-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(prospect); }}>
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>

                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-6">
                        <h4 className="font-semibold text-sm line-clamp-2" title={prospect.company}>{prospect.company}</h4>
                        <p className="text-xs text-muted-foreground">{prospect.contactName || 'Sin contacto'}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${interesColor} flex-shrink-0`}
                        title={`Interés: ${level}%`} />
                </div>

                <div className="space-y-1 mt-2">
                    {prospect.country && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {prospect.country}
                        </div>
                    )}

                    {prospect.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {prospect.phone}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function PipelineColumn({ stage, prospects, onProspectClick, onEdit }) {
    const count = prospects.length;

    return (
        <div className="flex-shrink-0 w-72 flex flex-col h-full">
            <Card className={`h-full flex flex-col border-t-4 ${stage.color} border-t-primary/20`}>
                <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{stage.label}</span>
                        <Badge variant="secondary" className="ml-2">{count}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-1 p-2">
                    <div className="space-y-2">
                        {prospects.map(prospect => (
                            <ProspectCard
                                key={prospect.id}
                                prospect={prospect}
                                onClick={onProspectClick}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminProspects() {
    const { toast } = useToast();

    // Hooks
    const { data: prospects = [], isLoading: loading } = useProspects();
    const createProspect = useCreateProspect();
    const updateProspect = useUpdateProspect();
    const deleteProspect = useDeleteProspect();

    // UI State
    const [pipelineStages, setPipelineStages] = useState(PIPELINE_STAGES);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProspect, setSelectedProspect] = useState(null);

    // Fetch dynamic stages
    useEffect(() => {
        const loadStages = async () => {
            try {
                // Use api.get which now handles /api prefix
                const res = await import('@/utils/api').then(m => m.api.get('/catalog/pipeline-stages'));
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        // Map backend format to frontend format
                        const mapped = data.sort((a, b) => a.orderIndex - b.orderIndex).map(s => ({
                            id: s.value,
                            label: s.label,
                            color: s.color || 'bg-gray-100 dark:bg-gray-800'
                        }));
                        setPipelineStages(mapped);
                    }
                }
            } catch (err) {
                console.error("Failed to load pipeline stages, using defaults", err);
            }
        };
        loadStages();
    }, []);

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});

    // Actions
    const handleSave = async () => {
        try {
            if (editingId) {
                await updateProspect.mutateAsync({ id: editingId, data: formData });
                toast({ title: 'Prospecto actualizado' });
            } else {
                await createProspect.mutateAsync(formData);
                toast({ title: 'Prospecto creado' });
            }
            setIsDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'No se pudo guardar el prospecto', variant: 'destructive' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este prospecto?')) return;
        try {
            await deleteProspect.mutateAsync(id);
            toast({ title: 'Prospecto eliminado' });
            setSelectedProspect(null);
        } catch (e) {
            console.error(e);
        }
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setFormData({ ...p });
        setIsDialogOpen(true);
    };

    const openNew = () => {
        setEditingId(null);
        setFormData({ status: 'NUEVO', interestLevel: 50, country: '', company: '' });
        setIsDialogOpen(true);
    };

    // Filtering
    const filteredProspects = prospects.filter(p => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (p.company || '').toLowerCase().includes(s) ||
            (p.contactName || '').toLowerCase().includes(s) ||
            (p.email || '').toLowerCase().includes(s);
    });

    // Grouping
    const prospectsByStage = pipelineStages.reduce((acc, stage) => {
        acc[stage.id] = filteredProspects.filter(p =>
            (p.stage || p.status || 'NUEVO') === stage.id
        );
        return acc;
    }, {});

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando pipeline...</div>;

    return (
        <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col animate-fade-in">
            {/* Standardized Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        <GitMerge className="h-8 w-8 text-primary" />
                        Pipeline de Prospectos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestión de potenciales clientes y seguimiento de ventas.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar prospecto..." 
                            className="pl-9 w-full sm:w-[260px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all focus:ring-primary"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button onClick={openNew} className="rounded-xl shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Prospecto
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 pb-4 h-full min-w-max">
                    {pipelineStages.map(stage => (
                        <PipelineColumn
                            key={stage.id}
                            stage={stage}
                            prospects={prospectsByStage[stage.id] || []}
                            onProspectClick={setSelectedProspect}
                            onEdit={openEdit}
                        />
                    ))}
                </div>
            </div>

            {/* Detail View Modal */}
            {selectedProspect && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                    onClick={() => setSelectedProspect(null)}>
                    <Card className="max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>{selectedProspect.company}</CardTitle>
                            <Badge>{selectedProspect.status}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Contacto</span>
                                    {selectedProspect.contactName || '-'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Email</span>
                                    {selectedProspect.email || '-'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Teléfono</span>
                                    {selectedProspect.phone || '-'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">País</span>
                                    {selectedProspect.country || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-muted-foreground block text-xs uppercase mb-1">Notas</span>
                                <div className="bg-muted p-3 rounded text-sm min-h-[60px]">
                                    {selectedProspect.notes || 'Sin notas.'}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedProspect.id)}>Eliminar</Button>
                                <Button onClick={() => { setSelectedProspect(null); openEdit(selectedProspect); }}>Editar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Prospecto' : 'Nuevo Prospecto'}</DialogTitle>
                        <DialogDescription>Información del cliente potencial.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Empresa</Label>
                                <Input value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contacto</Label>
                                <Input value={formData.contactName || ''} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <GlobalPhoneInput value={formData.phone || ''} onChange={val => setFormData({ ...formData, phone: val })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>País</Label>
                                <Input value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status || 'NUEVO'} onValueChange={v => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {pipelineStages.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nivel de Interés (0-100)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.interestLevel || 50}
                                onChange={e => setFormData({ ...formData, interestLevel: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}