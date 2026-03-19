/**
 * @file ClientDetail.jsx
 * @description Componente de página (Vista) para la sección ClientDetail.
 * @module Frontend Page
 * @path /frontend/src/pages/CRM/ClientDetail.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Key, ArrowLeft, Server, Activity } from 'lucide-react';
import { DataTable } from '@/components/DataTable';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const res = await api.get(`/clients/${id}`);
            if (!res.ok) throw new Error('Client not found');
            return res.json();
        }
    });

    if (isLoading) return <div className="p-10"><Skeleton className="h-96" /></div>;
    if (!client) return <div className="p-10">Cliente no encontrado</div>;

    const licenseCols = [
        { key: 'serialKey', label: 'Serial', render: v => <span className="font-mono text-xs">{v}</span> },
        {
            key: 'status', label: 'Estado', render: (v, r) => {
                const isExpired = r.expirationDate && new Date(r.expirationDate) < new Date();
                if (isExpired) return <Badge variant="destructive">Vencida</Badge>;
                return <Badge className="bg-emerald-500">{v}</Badge>;
            }
        },
        { key: 'hostingType', label: 'Hosting', render: v => <Badge variant="outline">{v}</Badge> },
        { key: 'limitQuestions', label: 'Preguntas', render: v => v || '∞' },
        { key: 'limitAdmins', label: 'Admins', render: v => v }
    ];

    const userCols = [
        { key: 'fullName', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol', render: v => <Badge variant="secondary">{v}</Badge> }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/admin/crm')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                    <p className="text-muted-foreground">ID: {client.id} · {client.city}, {client.countryCode}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="font-semibold">Tipo:</span>
                            <span>{client.clientType || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Teléfono:</span>
                            <span>{client.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Tax ID:</span>
                            <span>{client.taxId || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Métricas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <Key className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                            <div className="text-2xl font-bold">{client.licenses.length}</div>
                            <div className="text-xs text-muted-foreground">Licencias</div>
                        </div>
                        <div className="text-center p-2 bg-indigo-50 rounded-lg">
                            <User className="h-6 w-6 mx-auto text-indigo-500 mb-1" />
                            <div className="text-2xl font-bold">{client.users.length}</div>
                            <div className="text-xs text-muted-foreground">Usuarios</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Relations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-xl shadow-sm border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Licencias</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={licenseCols} data={client.licenses} />
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={userCols} data={client.users} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
