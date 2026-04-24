import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useClients } from '@/hooks/useApi';
import { useTranslation } from 'react-i18next';
import {
    Users, Globe, Award, DollarSign, TrendingUp, Target,
    AlertTriangle, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw, Key, Server, BadgeAlert, UserMinus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const PROVIDER_COLORS = {
    'MOCHAHOST': '#3b82f6',
    '247HOST': '#10b981',
    'GODADDY': '#f59e0b',
    'POOL': '#8b5cf6',
    'Sin proveedor': '#6b7280'
};

export default function Estadisticas() {
    const { t } = useTranslation();
    
    // Data Fetching
    const { data: crmMetrics, isLoading: crmLoading } = useQuery({
        queryKey: ['crmMetrics'],
        queryFn: async () => {
            const res = await api.get('/crm/metrics');
            if (res.ok) return res.json();
            return null; // Fallback gracefully if endpoint fails
        }
    });

    const { data: licenses = [], isLoading: licensesLoading } = useQuery({
        queryKey: ['licenses'],
        queryFn: async () => {
            const res = await api.get('/licenses');
            if (res.ok) return res.json();
            return [];
        }
    });

    const { data: organizations = [], isLoading: orgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await api.get('/organizations');
            if (res.ok) return res.json();
            return [];
        }
    });

    const { data: clientsData = null, isLoading: clientsLoading } = useClients();

    const { data: churnByCountry = [], isLoading: churnLoading } = useQuery({
        queryKey: ['churnByCountry'],
        queryFn: async () => {
            const res = await api.get('/crm/churn-by-country');
            if (res.ok) return res.json();
            return [];
        }
    });

    const { data: serverCosts = null, isLoading: costsLoading } = useQuery({
        queryKey: ['serverCosts'],
        queryFn: async () => {
            const res = await api.get('/servers/costs');
            if (res.ok) return res.json();
            return null;
        }
    });

    const { data: expiringServers = [], isLoading: expServersLoading } = useQuery({
        queryKey: ['expiringServers'],
        queryFn: async () => {
            const res = await api.get('/servers/expiring');
            if (res.ok) return res.json();
            return [];
        }
    });

    const loading = crmLoading || licensesLoading || orgsLoading || clientsLoading || churnLoading || costsLoading || expServersLoading;

    if (loading) return <div className="p-10"><Skeleton className="h-96 w-full" /></div>;

    // --- CÁLCULOS MANUALES Y COMBINADOS ---
    // 1. Métricas CRM extraídas
    const financial = crmMetrics?.financial || { mrr: 0, arr: 0, ltv: 0, arpu: 0 };
    const retention = crmMetrics?.retention || { renewalRate: 0, churnRate: 0, expiringSoon: 0, activeLicenses: 0, expiredLicenses: 0 };
    const customers = crmMetrics?.customers || { totalUsers: 0, totalLicenses: licenses.length, topCountry: '-', topPlan: '-', licensesByType: {} };
    const alerts = crmMetrics?.alerts || { expiringSoon: [] };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    // 2. Cálculos ad-hoc 
    const currentYear = new Date().getFullYear();
    const newClientsThisYear = organizations.filter(org => new Date(org.createdAt).getFullYear() === currentYear).length;
    const clientStats = clientsData?.stats || null;

    // Distribución Geográfica (Basada en Organizaciones)
    const geoCount = organizations.reduce((acc, org) => {
        const code = org.countryCode || t('common.na');
        acc[code] = (acc[code] || 0) + 1;
        return acc;
    }, {});
    const geoData = Object.keys(geoCount).map(k => ({ name: k, value: geoCount[k] })).sort((a,b) => b.value - a.value);

    // Distribución por Plan de Hosting (Basado en organizaciones o licencias)
    const hostingsCount = organizations.reduce((acc, org) => {
        const plan = org.hostingPlan?.name || t('common.none');
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {});
    const hostingData = Object.keys(hostingsCount).map(k => ({ name: k, value: hostingsCount[k] })).sort((a,b) => b.value - a.value);

    // Distribución Plan de Licencia (Graph Data)
    const licenseTypeData = Object.entries(customers.licensesByType || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Infra Provider Data
    const providerData = serverCosts?.byProveedor ?
        Object.entries(serverCosts.byProveedor).map(([name, data]) => ({
            name,
            value: data.costoMensual,
            count: data.count
        })) : [];

    return (
        <div className="space-y-8 animate-fade-in p-2 pb-10">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    {t('statistics.title')}
                </h1>
                <p className="text-muted-foreground mt-1">{t('statistics.subtitle')}</p>
            </div>

            {/* SECCIÓN 1: RENTABILIDAD E INGRESOS */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.profitability')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-400"><DollarSign className="h-5 w-5" /></div>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('statistics.stats.mrr')}</p>
                            <p className="text-3xl font-black">{formatCurrency(financial.mrr)}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"><TrendingUp className="h-5 w-5" /></div>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('statistics.stats.arr')}</p>
                            <p className="text-3xl font-black">{formatCurrency(financial.arr)}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-gradient-to-br from-amber-500/10 to-transparent">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400"><Target className="h-5 w-5" /></div>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('statistics.stats.ltv')}</p>
                            <p className="text-3xl font-black">{formatCurrency(financial.ltv)}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-400"><Users className="h-5 w-5" /></div>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('statistics.stats.arpu')}</p>
                            <p className="text-3xl font-black">{formatCurrency(financial.arpu)}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN 2: ADQUISICIÓN Y CRECIMIENTO */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.growth')}</h2>
                
                {/* 4 Cards Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title={t('statistics.stats.totalUsers')} value={customers.totalUsers} icon={Users} color="bg-indigo-500/10 text-indigo-600" />
                    <StatCard title={t('statistics.stats.totalLicenses')} value={licenses.length || customers.totalLicenses} icon={Key} color="bg-blue-500/10 text-blue-600" />
                    <StatCard title={t('statistics.stats.newClientsYear')} value={newClientsThisYear} icon={Award} color="bg-emerald-500/10 text-emerald-600" />
                    <Card className="rounded-2xl shadow-sm border">
                        <CardHeader className="py-4 pb-2">
                            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground tracking-wider uppercase">
                                <Target className="h-4 w-4 text-blue-500" /> {t('statistics.stats.conversion')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black">{customers.totalUsers > 0 ? ((customers.totalLicenses / customers.totalUsers) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3 Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <StatCard title={t('statistics.stats.topCountry')} value={geoData[0]?.name || '-'} icon={Globe} color="bg-cyan-500/10 text-cyan-600" />
                    <StatCard title={t('statistics.stats.topLicense')} value={customers.topPlan} icon={Award} color="bg-purple-500/10 text-purple-600" />
                    <StatCard title={t('statistics.stats.topHosting')} value={hostingData[0]?.name || '-'} icon={Server} color="bg-slate-500/10 text-slate-600" />
                </div>
            </div>

            {/* SECCIÓN 3: RETENCIÓN Y ACTIVIDAD CRM */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.retention')}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Tasas Generales */}
                    <Card className="rounded-2xl shadow-sm border lg:col-span-1 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
                        <CardHeader className="py-4 pb-2"><CardTitle className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-500">{t('statistics.stats.renewalRate')}</CardTitle></CardHeader>
                        <CardContent><span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{retention.renewalRate.toFixed(1)}%</span></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border lg:col-span-1 border-rose-200 bg-rose-50 dark:bg-rose-900/10">
                        <CardHeader className="py-4 pb-2"><CardTitle className="text-xs font-bold uppercase text-rose-700 dark:text-rose-500">{t('statistics.stats.churnRate')}</CardTitle></CardHeader>
                        <CardContent><span className="text-2xl font-black text-rose-700 dark:text-rose-400">{retention.churnRate.toFixed(1)}%</span></CardContent>
                    </Card>
                    
                    {/* Actividad desde CRM */}
                    {clientStats && clientStats.period ? (
                        <>
                            <StatCard title={t('statistics.stats.renewed')} value={clientStats.period.renewed} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-600" />
                            <StatCard title={t('statistics.stats.notRenewed')} value={clientStats.period.notRenewed} icon={UserMinus} color="bg-rose-500/10 text-rose-600" />
                            <StatCard title={t('statistics.stats.inProcess')} value={clientStats.period.inProcess} icon={RefreshCw} color="bg-amber-500/10 text-amber-600" />
                            <StatCard title={t('statistics.stats.webRenewals')} value={clientStats.period.webRenewals} icon={Globe} color="bg-blue-500/10 text-blue-600" />
                        </>
                    ) : (
                        <div className="lg:col-span-4 flex items-center justify-center text-muted-foreground border rounded-2xl border-dashed">
                            {t('statistics.tables.noMetrics')}
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 4: ESTADO OPERATIVO Y ALERTAS */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.operational')}</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alertas (2 columnas) */}
                    <div className="lg:col-span-2">
                        <Card className="rounded-2xl border-yellow-500 border-2 shadow-xl h-full">
                            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/10">
                                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                                    <AlertTriangle className="h-5 w-5" /> {t('statistics.alerts.expirations')}
                                </CardTitle>
                                <CardDescription>{t('statistics.alerts.expirationsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {alerts?.expiringSoon && alerts.expiringSoon.length > 0 ? (
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                        {alerts.expiringSoon.slice(0, 5).map((alert) => (
                                            <div key={alert.id_licencia} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border">
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm">{alert.organization || t('statistics.alerts.noOrg')}</p>
                                                    <p className="text-xs text-muted-foreground">{alert.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={alert.daysUntilExpiry <= 7 ? 'destructive' : 'outline'} className="font-bold">
                                                        {alert.daysUntilExpiry} {alert.daysUntilExpiry !== 1 ? t('statistics.alerts.daysPlural') : t('statistics.alerts.days')}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('statistics.alerts.expires')} {new Date(alert.licencia_expira).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 text-muted-foreground">{t('statistics.alerts.noExpirations')}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Estado de licencias (1 columna vertical) */}
                    <Card className="rounded-2xl shadow-xl border-none">
                        <CardHeader>
                            <CardTitle>{t('statistics.status.title')}</CardTitle>
                            <CardDescription>{t('statistics.status.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">{retention.activeLicenses}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('statistics.status.active')}</p>
                                            <p className="text-xs text-muted-foreground">{t('statistics.status.activeDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">{retention.expiredLicenses}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('statistics.status.expired')}</p>
                                            <p className="text-xs text-muted-foreground">{t('statistics.status.expiredDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">{retention.expiringSoon}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('statistics.status.expiring')}</p>
                                            <p className="text-xs text-muted-foreground">{t('statistics.status.expiringDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN 5: ANÁLISIS DEMOGRÁFICO Y TÉCNICO */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.demographic')}</h2>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Distribución por Licencia */}
                    <Card className="rounded-2xl shadow-md border-none">
                        <CardHeader>
                            <CardTitle>{t('statistics.charts.licenseDist')}</CardTitle>
                            <CardDescription>{t('statistics.charts.licenseDistDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full min-h-[300px]">
                                {licenseTypeData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">{t('statistics.charts.noData')}</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100}>
                                        <PieChart>
                                            <Pie data={licenseTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                                {licenseTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribución Geográfica */}
                    <Card className="rounded-2xl shadow-md border-none">
                        <CardHeader>
                            <CardTitle>{t('statistics.charts.geoDist')}</CardTitle>
                            <CardDescription>{t('statistics.charts.geoDistDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full min-h-[300px]">
                                {geoData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">{t('statistics.charts.noData')}</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100}>
                                        <BarChart data={geoData.slice(0, 10)}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                                {geoData.map((_, index) => (
                                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribución Hosting */}
                    <Card className="rounded-2xl shadow-md border-none lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('statistics.charts.hostingDist')}</CardTitle>
                            <CardDescription>{t('statistics.charts.hostingDistDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full min-h-[300px]">
                                {hostingData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">{t('statistics.charts.noData')}</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100}>
                                        <BarChart data={hostingData.slice(0, 15)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                                {hostingData.map((_, index) => (
                                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Churn by Country */}
                    <Card className="rounded-2xl shadow-md border-none lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('statistics.charts.churnByCountry')}</CardTitle>
                            <CardDescription>{t('statistics.charts.churnByCountryDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {churnByCountry.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">{t('statistics.charts.noData')}</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                                        <BarChart data={churnByCountry.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="country" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="churnRate" fill="#ef4444" name="Churn %" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tablas de Segmentación */}
                {clientStats && clientStats.pivot && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <Card className="shadow-sm border">
                            <CardHeader className="py-4"><CardTitle className="text-sm">{t('statistics.tables.byClassification')}</CardTitle></CardHeader>
                            <CardContent className="pt-0">
                                <Table>
                                    <TableBody>
                                        {Object.entries(clientStats.pivot.typeCount).map(([k, v]) => (
                                            <TableRow key={k}><TableCell className="font-medium text-xs">{k}</TableCell><TableCell className="text-right text-xs">{v}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border">
                            <CardHeader className="py-4"><CardTitle className="text-sm">{t('statistics.tables.businessType')}</CardTitle></CardHeader>
                            <CardContent className="pt-0">
                                <Table>
                                    <TableBody>
                                        {Object.entries(clientStats.pivot.businessCount).map(([k, v]) => (
                                            <TableRow key={k}><TableCell className="font-medium text-xs">{k}</TableCell><TableCell className="text-right text-xs">{v}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border">
                            <CardHeader className="py-4"><CardTitle className="text-sm">{t('statistics.tables.serverType')}</CardTitle></CardHeader>
                            <CardContent className="pt-0">
                                <Table>
                                    <TableBody>
                                        {Object.entries(clientStats.pivot.serverCount).map(([k, v]) => (
                                            <TableRow key={k}><TableCell className="font-medium text-xs">{k}</TableCell><TableCell className="text-right text-xs">{v}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border">
                            <CardHeader className="py-4"><CardTitle className="text-sm">{t('statistics.tables.studyType')}</CardTitle></CardHeader>
                            <CardContent className="pt-0">
                                <Table>
                                    <TableBody>
                                        {Object.entries(clientStats.pivot.studyCount).map(([k, v]) => (
                                            <TableRow key={k}><TableCell className="font-medium text-xs">{k}</TableCell><TableCell className="text-right text-xs">{v}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* SECCIÓN 6: INFRAESTRUCTURA Y COSTOS */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2 uppercase tracking-wide text-muted-foreground">{t('statistics.sections.infrastructure')}</h2>
                
                {serverCosts && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title={t('statistics.stats.totalServers')} value={serverCosts.totalServidores} icon={Server} color="bg-slate-500/10 text-slate-600" />
                        <StatCard title={t('statistics.stats.monthlyCost')} value={formatCurrency(serverCosts.totalMensual)} icon={DollarSign} color="bg-blue-500/10 text-blue-600" />
                        <StatCard title={t('statistics.stats.annualCost')} value={formatCurrency(serverCosts.totalAnual)} icon={DollarSign} color="bg-indigo-500/10 text-indigo-600" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Cost Distribution */}
                    <Card className="rounded-2xl shadow-md border-none lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{t('statistics.charts.costByProvider')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                {providerData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">{t('statistics.charts.noData')}</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                                        <PieChart>
                                            <Pie
                                                data={providerData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                labelLine={false}
                                            >
                                                {providerData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.name] || '#94a3b8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expiring Servers Table */}
                    <Card className="rounded-2xl shadow-md border lg:col-span-2 border-amber-200">
                        <CardHeader className="bg-amber-50 dark:bg-amber-900/10">
                            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                <AlertTriangle className="h-5 w-5" /> {t('statistics.alerts.serverExpirations')}
                            </CardTitle>
                            <CardDescription>{t('statistics.alerts.serverExpirationsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {expiringServers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('statistics.tables.server')}</TableHead>
                                            <TableHead>{t('statistics.tables.provider')}</TableHead>
                                            <TableHead>{t('statistics.tables.expiration')}</TableHead>
                                            <TableHead>{t('statistics.tables.remaining')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expiringServers.map(server => (
                                            <TableRow key={server.id}>
                                                <TableCell className="font-medium">{server.name}</TableCell>
                                                <TableCell>{server.proveedor || t('common.na')}</TableCell>
                                                <TableCell>
                                                    {server.fecha_vencimiento ? new Date(server.fecha_vencimiento).toLocaleDateString() : t('common.na')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={server.daysUntilExpiry <= 7 ? 'destructive' : 'default'}>
                                                        {server.daysUntilExpiry} {server.daysUntilExpiry !== 1 ? t('statistics.alerts.daysPlural') : t('statistics.alerts.days')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center p-6 text-muted-foreground">{t('statistics.alerts.noServerExpirations')}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}