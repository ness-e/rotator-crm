/**
 * @file ClientDetail.jsx
 * @description Vista detallada de una organización/cliente con gestión de licencias y usuarios.
 * @module Frontend Page
 * @path /frontend/src/pages/CRM/ClientDetail.jsx
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Key, ArrowLeft, Server, Activity, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: client, isLoading, error } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            console.log(`Fetching client detail for ID: ${id}`);
            const res = await api.get(`/clients/${id}`);
            if (!res.ok) throw new Error('Client not found');
            const data = await res.json();
            console.log('Client Data received:', data);
            return data;
        },
        retry: false
    });

    if (isLoading) return (
        <div className="p-8 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (error || !client) return (
        <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Activity className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Error al cargar cliente</h2>
            <p className="text-muted-foreground">{error?.message || 'El cliente solicitado no existe o no tiene permisos para verlo.'}</p>
            <Button variant="outline" onClick={() => navigate('/admin/crm')}>Volver al CRM</Button>
        </div>
    );

    const licenseCols = [
        { 
            key: 'id', label: 'Licencia', render: (v, r) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 font-mono text-xs">{r.serialKey}</span>
                    <span className="text-[10px] text-muted-foreground">{r.friendlyName || 'Sin apodo'}</span>
                </div>
            ) 
        },
        { 
            key: 'status', label: 'Estado', render: (v) => {
                const colors = {
                    'ACTIVE': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
                    'EXPIRED': 'bg-red-500/10 text-red-600 border-red-200',
                    'SUSPENDED': 'bg-amber-500/10 text-amber-600 border-amber-200'
                };
                return <Badge variant="outline" className={colors[v] || ''}>{v}</Badge>;
            }
        },
        { 
            key: 'server', label: 'Servidor / Dominio', render: (_, r) => {
                const ls = r.licenseServers?.[0];
                if (!ls) return <span className="text-muted-foreground italic text-xs">No asignado</span>;
                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Server className="h-3 w-3 text-blue-500" />
                            {ls.server?.name || 'Servidor Desconocido'}
                        </div>
                        {ls.domain && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Activity className="h-2.5 w-2.5" />
                                {ls.domain.domainName}
                            </div>
                        )}
                    </div>
                );
            }
        },
        { 
            key: 'expirationDate', label: 'Vencimiento', render: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' 
        }
    ];

    const userCols = [
        { key: 'name', label: 'Usuario', render: (_, r) => (
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {r.firstName?.[0] || r.email?.[0]}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium">{`${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Sin Nombre'}</span>
                    <span className="text-[10px] text-muted-foreground">{r.email}</span>
                </div>
            </div>
        )},
        { key: 'role', label: 'Rol', render: (v) => <Badge variant="secondary" className="text-[10px]">{v}</Badge> },
        { key: 'isActive', label: 'Estado', render: (v) => v ? <Badge className="bg-emerald-500">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge> }
    ];

    return (
        <PageLayout 
            title={client.name}
            subtitle={`Perfil detallado del cliente · ${client.city || 'Ciudad no definida'}, ${client.countryCode || 'XX'}`}
            backAction={() => navigate('/admin/crm')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* INFO CARD */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Información General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-slate-400 mt-1" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Email Principal</span>
                                    <span className="text-sm">{client.email || 'No definido'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-slate-400 mt-1" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Teléfono</span>
                                    <span className="text-sm">{client.phone || 'No definido'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Dirección</span>
                                    <span className="text-sm">{client.address || 'No definida'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <div className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Licencias</div>
                                    <div className="text-2xl font-black text-slate-900">{client.licenses?.length || 0}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <div className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Usuarios</div>
                                    <div className="text-2xl font-black text-slate-900">{client.users?.length || 0}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CONTENT AREA */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="licenses" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="licenses" className="gap-2">
                                <Key className="h-4 w-4" /> Licencias
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <User className="h-4 w-4" /> Usuarios
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="licenses">
                            <Card className="shadow-sm border-slate-200">
                                <CardContent className="p-0">
                                    <DataTable 
                                        columns={licenseCols} 
                                        data={client.licenses || []} 
                                        emptyState={<div className="py-12 text-center text-muted-foreground italic">Este cliente no posee licencias registradas.</div>}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="users">
                            <Card className="shadow-sm border-slate-200">
                                <CardContent className="p-0">
                                    <DataTable 
                                        columns={userCols} 
                                        data={client.users || []} 
                                        emptyState={<div className="py-12 text-center text-muted-foreground italic">No hay usuarios asociados a esta organización.</div>}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PageLayout>
    );
}
