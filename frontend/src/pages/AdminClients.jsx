/**
 * @file AdminClients.jsx
 * @description Componente de página (Vista) para la sección AdminClients.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminClients.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, UserMinus, Globe, Award, Server, Briefcase } from 'lucide-react';
import { useClients } from '@/hooks/useApi';
import { getRenewalStatusColor, getRenewalStatusLabel } from '@/constants/renewalStatus';

// Helper for Stats Cards
const StatCard = ({ title, value, sub, icon: Icon, color }) => (
    <Card>
        <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full ${color} text-white shadow-lg`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">{value}</h3>
                    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                </div>
            </div>
        </CardContent>
    </Card>
)

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
                <p className="text-muted-foreground">Indicadores de renovación y desglose de cartera.</p>
            </div>

            {/* Section 1: Top Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Renovaron" value={stats.period.renewed} icon={TrendingUp} color="bg-emerald-500" />
                <StatCard title="No Renovaron" value={stats.period.notRenewed} icon={UserMinus} color="bg-rose-500" />
                <StatCard title="En Proceso" value={stats.period.inProcess} icon={Users} color="bg-amber-500" />
                <StatCard title="Renov. Web" value={stats.period.webRenewals} icon={Globe} color="bg-blue-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Clientes Nuevos" value={stats.newClients.total}
                    sub={`${stats.newClients.invoice} Fac. / ${stats.newClients.web} Web`}
                    icon={Award} color="bg-indigo-500" />
                <StatCard title="Top País" value={stats.topCountry.name} sub={`${stats.topCountry.count} clientes`} icon={Globe} color="bg-cyan-600" />
                <StatCard title="Plan Top" value={stats.topPlan.name} sub={`${stats.topPlan.count} licencias`} icon={Briefcase} color="bg-purple-600" />
            </div>

            {/* Section 2: Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4"><CardTitle className="text-sm">Por Clasificación</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <Table>
                            <TableBody>
                                {Object.entries(stats.pivot.typeCount).map(([k, v]) => (
                                    <TableRow key={k}><TableCell className="font-medium">{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4"><CardTitle className="text-sm">Tipo de Negocio</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <Table>
                            <TableBody>
                                {Object.entries(stats.pivot.businessCount).map(([k, v]) => (
                                    <TableRow key={k}><TableCell className="font-medium">{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4"><CardTitle className="text-sm">Tipo de Server</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <Table>
                            <TableBody>
                                {Object.entries(stats.pivot.serverCount).map(([k, v]) => (
                                    <TableRow key={k}><TableCell className="font-medium">{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4"><CardTitle className="text-sm">Tipo de Estudio</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <Table>
                            <TableBody>
                                {Object.entries(stats.pivot.studyCount).map(([k, v]) => (
                                    <TableRow key={k}><TableCell className="font-medium">{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Section 3: Main Table */}
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
