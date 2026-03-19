/**
 * @file HostingCosts.jsx
 * @description Componente de página (Vista) para la sección HostingCosts.
 * @module Frontend Page
 * @path /frontend/src/pages/HostingCosts.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/utils/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Server, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const PROVIDER_COLORS = {
    'MOCHAHOST': '#3b82f6',
    '247HOST': '#10b981',
    'GODADDY': '#f59e0b',
    'POOL': '#8b5cf6',
    'Sin proveedor': '#6b7280'
}

export default function HostingCosts() {
    const [costs, setCosts] = useState(null)
    const [servers, setServers] = useState([])
    const [expiring, setExpiring] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [costsRes, serversRes, expiringRes] = await Promise.all([
                api.get('/servers/costs'),
                api.get('/servers'),
                api.get('/servers/expiring')
            ])

            if (costsRes.ok) setCosts(await costsRes.json())
            if (serversRes.ok) setServers(await serversRes.json())
            if (expiringRes.ok) setExpiring(await expiringRes.json())
        } catch (error) {
            console.error('Error loading hosting data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Cargando costos de hosting...</div>
    }

    // Prepare data for pie chart
    const providerData = costs?.byProveedor ?
        Object.entries(costs.byProveedor).map(([name, data]) => ({
            name,
            value: data.costoMensual,
            count: data.count
        })) : []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Costos de Hosting</h1>
                <p className="text-muted-foreground">
                    Administra y monitorea tus gastos de infraestructura
                </p>
            </div>

            {/* Summary Cards */}
            {costs && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">Costo Mensual</p>
                            </div>
                            <div className="text-2xl font-bold">${costs.totalMensual.toFixed(2)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">Costo Anual</p>
                            </div>
                            <div className="text-2xl font-bold">${costs.totalAnual.toFixed(2)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">Total Servidores</p>
                            </div>
                            <div className="text-2xl font-bold">{costs.totalServidores}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <p className="text-sm font-medium text-muted-foreground">Próximos a Vencer</p>
                            </div>
                            <div className="text-2xl font-bold text-amber-600">{expiring.length}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart - Distribution by Provider */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Proveedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {providerData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={providerData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {providerData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.name] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Sin datos de proveedores</p>
                        )}
                    </CardContent>
                </Card>

                {/* Size Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Tamaño</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {costs?.byTamanio && Object.entries(costs.byTamanio).map(([size, count]) => (
                                <div key={size} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{size}</span>
                                    <Badge variant="secondary">{count} servidor{count !== 1 ? 'es' : ''}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expiring Servers Alert */}
            {expiring.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <AlertCircle className="h-5 w-5" />
                            Servidores Próximos a Vencer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servidor</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Días Restantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiring.map(server => (
                                    <TableRow key={server.id}>
                                        <TableCell className="font-medium">{server.name}</TableCell>
                                        <TableCell>{server.proveedor || 'N/A'}</TableCell>
                                        <TableCell>{server.cliente_asignado || 'N/A'}</TableCell>
                                        <TableCell>
                                            {server.fecha_vencimiento ?
                                                new Date(server.fecha_vencimiento).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={server.daysUntilExpiry <= 7 ? 'destructive' : 'default'}>
                                                {server.daysUntilExpiry} días
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* All Servers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Todos los Servidores</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Tamaño</TableHead>
                                <TableHead>Precio Mensual</TableHead>
                                <TableHead>Precio Anual</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servers.map(server => (
                                <TableRow key={server.id}>
                                    <TableCell className="font-medium">{server.name}</TableCell>
                                    <TableCell>{server.proveedor || '-'}</TableCell>
                                    <TableCell>{server.tamanio || '-'}</TableCell>
                                    <TableCell>
                                        {server.precio_mensual ? `$${server.precio_mensual.toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {server.precio_anual ? `$${server.precio_anual.toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell>{server.cliente_asignado || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={server.status === 'active' ? 'default' : 'secondary'}>
                                            {server.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
