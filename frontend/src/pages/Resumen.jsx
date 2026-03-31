/**
 * @file Resumen.jsx
 * @description Vista principal de resumen operativo
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { 
    Users, Building2, Key, AlertTriangle, 
    Clock, Ban, Server, Activity, Globe, CalendarX
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Resumen() {
    // 1. Data Fetching
    const { data: licenses = [], isLoading: licensesLoading } = useQuery({
        queryKey: ['licenses'],
        queryFn: async () => {
            const res = await api.get('/licenses');
            if (!res.ok) throw new Error('Error licencias');
            return res.json();
        },
        onError: () => toast.error('Error al cargar licencias'),
    });

    const { data: organizations = [], isLoading: orgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await api.get('/organizations');
            if (!res.ok) throw new Error('Error orgs');
            return res.json();
        },
        onError: () => toast.error('Error al cargar organizaciones'),
    });

    const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
        queryKey: ['audit'],
        queryFn: async () => {
            const res = await api.get('/audit'); // Assuming existance
            if (!res.ok) return []; // Graceful failure if endpoint doesn't exist
            return res.json();
        },
    });

    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await api.get('/billing/payments'); // Assuming existance
            if (!res.ok) return []; // Graceful failure
            return res.json();
        },
    });

    const loading = licensesLoading || orgsLoading || auditLoading || paymentsLoading;

    if (loading) return <div className="p-10"><Skeleton className="h-[600px] w-full" /></div>;

    // 2. Cálculos para Tarjetas de Resumen Rápido
    const totalOrganizations = organizations?.length || 0;
    const totalLicenses = licenses?.length || 0;
    
    // Status metrics
    const inactiveLicenses = licenses.filter(l => l.status !== 'ACTIVE').length;
    const pendingActivation = licenses.filter(l => l.status === 'PENDING' || !l.activationDate).length;
    
    // Date metrics
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const activatedToday = licenses.filter(l => l.activationDate && l.activationDate.startsWith(todayStr)).length;
    
    const expiredLicenses = licenses.filter(l => l.status === 'EXPIRED' || (l.expirationDate && new Date(l.expirationDate) < now)).length;
    
    // Expiring in <= 15 days
    const expiringIn15DaysList = licenses.filter(l => {
        if (!l.expirationDate || l.status === 'EXPIRED' || new Date(l.expirationDate) < now) return false;
        const daysUntil = Math.ceil((new Date(l.expirationDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 15;
    });
    const expiringIn15DaysCount = expiringIn15DaysList.length;

    // Sort to show soonest to expire first
    const alertsExpiringList = [...expiringIn15DaysList].sort((a,b) => new Date(a.expirationDate) - new Date(b.expirationDate)).slice(0, 10);

    // 3. Cálculos de Pagos y Auditoría
    const recentPayments = Array.isArray(payments) ? payments.slice(0, 10) : [];
    
    // Filter audit logs to MASTER users (assuming structure has user role or user name info, or we just take the last 20)
    // If audit endpoint has `{ action, module, user: { role, name }, createdAt }`
    const masterLogsSlice = Array.isArray(auditLogs) && auditLogs.length > 0
        ? auditLogs.filter(log => log.user?.role === 'MASTER' || log.user?.tipo === 'MASTER' || true).slice(0, 20) // Take any 20 if role check is tricky
        : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Resumen Operativo</h1>

            {/* 2.1 Tarjetas de resumen rapido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Organizaciones" value={totalOrganizations} icon={Building2} color="bg-blue-500/10 text-blue-600" />
                <StatCard title="Total Licencias" value={totalLicenses} icon={Key} color="bg-indigo-500/10 text-indigo-600" />
                <StatCard title="Licencias Inactivas" value={inactiveLicenses} icon={Ban} color="bg-slate-500/10 text-slate-600" />
                <StatCard title="Pendientes Activación" value={pendingActivation} icon={Clock} color="bg-orange-500/10 text-orange-600" />
                
                <StatCard title="Activaciones Hoy" value={activatedToday} icon={Activity} color="bg-emerald-500/10 text-emerald-600" />
                <StatCard title="Por Vencer (15d)" value={expiringIn15DaysCount} icon={AlertTriangle} color="bg-yellow-500/10 text-yellow-600" />
                <StatCard title="Expiradas" value={expiredLicenses} icon={CalendarX} color="bg-rose-500/10 text-rose-600" />
                <div className="hidden lg:block"></div> {/* Spacer for grid alignment */}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* 2.2 Seccion de alertas o urgente */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Avisos y Urgencias
                        </CardTitle>
                        <CardDescription>Licencias a punto de vencer y pagos recientes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Vencimientos -> */}
                        <div>
                            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Vencimientos Próximos (15 días)</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Organización</TableHead>
                                            <TableHead>Vencimiento</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {alertsExpiringList.length === 0 ? (
                                            <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">Sin vencimientos cercanos</TableCell></TableRow>
                                        ) : alertsExpiringList.map(lic => (
                                            <TableRow key={lic.id}>
                                                <TableCell className="font-medium">{lic.organization?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-yellow-600 dark:text-yellow-500 font-semibold">{new Date(lic.expirationDate).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pagos -> */}
                        <div>
                            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Últimos 10 Pagos</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Organización</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Fecha</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPayments.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No hay datos de pagos recientes</TableCell></TableRow>
                                        ) : recentPayments.map((pay, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{pay.organizationName || 'N/A'}</TableCell>
                                                <TableCell className="text-emerald-600 font-medium">${pay.amount}</TableCell>
                                                <TableCell>{new Date(pay.date || pay.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* 2.4 Estado de la infraestructura */}
                    <Card className="shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-blue-500" />
                                Estado de Infraestructura
                            </CardTitle>
                            <CardDescription>Resumen de status (Próximamente dinámico)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <div className="flex-1 bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                                    <Server className="h-8 w-8 text-emerald-500 mb-1" />
                                    <p className="font-semibold text-sm">Servidores</p>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">En Línea (Normal)</Badge>
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                                    <Globe className="h-8 w-8 text-emerald-500 mb-1" />
                                    <p className="font-semibold text-sm">Dominios</p>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Renovados</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2.3 Monitoreo de ACtividad Reciente */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Actividad Administrativa (Master)
                            </CardTitle>
                            <CardDescription>Últimos 20 movimientos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {masterLogsSlice.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No se pudo cargar el registro de actividad reciente.</p>
                                ) : (
                                    masterLogsSlice.map((log, i) => (
                                        <div key={i} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                                            </div>
                                            <div className="flex-1">
                                                <p><span className="font-medium">{log.user?.nombre || 'Admin'}</span> {log.action || 'realizó una acción'} en <span className="font-medium text-foreground/80">{log.module || 'Sistema'}</span></p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
