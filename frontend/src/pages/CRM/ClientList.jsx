/**
 * @file ClientList.jsx
 * @description Componente de página (Vista) para la sección ClientList.
 * @module Frontend Page
 * @path /frontend/src/pages/CRM/ClientList.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export default function ClientList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients-active'],
        queryFn: async () => {
            const res = await api.get('/clients/active');
            return res.json();
        }
    });

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.taxId && c.taxId.includes(search))
    );

    const columns = [
        {
            key: 'name', label: 'Organización', render: (v, r) => (
                <div className="flex flex-col">
                    <span className="font-bold">{v}</span>
                    <span className="text-xs text-muted-foreground">{r.city}, {r.countryCode}</span>
                </div>
            )
        },
        { key: 'clientType', label: 'Tipo', render: (v) => <Badge variant="outline">{v || 'C'}</Badge> },
        { key: 'licenses', label: 'Licencias', render: (v) => <Badge>{v?.length || 0}</Badge> },
        { key: 'users', label: 'Usuarios', render: (v) => <span className="text-sm">{v?.length || 0}</span> },
        {
            key: 'actions', label: 'Acciones', render: (_, r) => (
                <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/crm/clients/${r.id}`)}>
                    <Eye className="h-4 w-4 text-blue-500" />
                </Button>
            )
        }
    ];

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <CardTitle>Listado de Clientes</CardTitle>
                    <Input
                        placeholder="Buscar cliente..."
                        className="w-64"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <DataTable columns={columns} data={filtered} isLoading={isLoading} />
            </CardContent>
        </Card>
    );
}
