/**
 * @file AdminClients.jsx
 * @description Componente de página (Vista) para la sección AdminClients.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminClients.jsx
 * @lastUpdated 2026-03-23
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useClients } from '@/hooks/useApi';
import { getRenewalStatusColor, getRenewalStatusLabel } from '@/constants/renewalStatus';


export default function AdminClients() {
    // TanStack Query hook - fetches data automatically
    const { data, isLoading: loading } = useClients();

    const stats = data?.stats || null;
    const users = data?.users || [];

    if (loading || !stats) return <div className="p-8 text-center">Cargando CRM...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clientes Activos & CRM</h1>
                <p className="text-muted-foreground">Listado general de la cartera de clientes actuales.</p>
            </div>

            {/* Section 1: Main Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Listado Detallado</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[600px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>R</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Compra</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Servidor</TableHead>
                                <TableHead>País/Ciudad</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Emails</TableHead>
                                <TableHead>Negocio</TableHead>
                                <TableHead>Estudio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u, i) => (
                                <TableRow key={u.id_cliente}>
                                    <TableCell>{i + 1}</TableCell>
                                    <TableCell>
                                        {u.renewal_status ? (
                                            <Badge className={`${getRenewalStatusColor(u.renewal_status)} text-white hover:opacity-90`}>
                                                {getRenewalStatusLabel(u.renewal_status)}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">-</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">{u.organizacion_cliente || '-'}</TableCell>
                                    <TableCell>{u.client_type || '-'}</TableCell>
                                    <TableCell className="whitespace-nowrap font-mono text-xs">{u.license?.licencia_expira || '-'}</TableCell>
                                    <TableCell className="whitespace-nowrap font-mono text-xs">{u.fecha_registro || '-'}</TableCell>
                                    <TableCell>{u.license?.licencia_tipo || '-'}</TableCell>
                                    <TableCell>{u.license?.hosting ? 'Nube' : 'Local'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span>{u.country?.name || u.pais_cliente}</span>
                                            <span className="text-muted-foreground">{u.ciudad_cliente}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.nombre_cliente} {u.apellido_cliente}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs max-w-[150px] truncate">
                                            <span title={u.admin_email}>Adm: {u.admin_email || '-'}</span>
                                            <span title={u.correo_cliente} className="text-muted-foreground">Usr: {u.correo_cliente}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.marketTarget?.abbreviation || u.business_type || '-'}</TableCell>
                                    <TableCell>{u.study_type || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
