/**
 * @file Dashboard.jsx
 * @description Vista principal de resumen operativo
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { useProspects } from '@/hooks/useApi';
import { 
    Users, Building2, Key, AlertTriangle, 
    Clock, Ban, Server, Activity, Globe, CalendarX
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';

export default function Dashboard() {
    const { t, i18n } = useTranslation();

    // Map i18next language to date-fns locale
    const dateLocale = useMemo(() => {
        switch (i18n.language) {
            case 'en': return enUS
            case 'pt': return ptBR
            case 'fr': return fr
            default: return es
        }
    }, [i18n.language])

    // 1. Data Fetching
    const { data: licenses = [], isLoading: licensesLoading } = useQuery({
        queryKey: ['licenses'],
        queryFn: async () => {
            const res = await api.get('/licenses');
            if (!res.ok) throw new Error(t('common.error'));
            return res.json();
        },
        onError: () => toast.error(t('dashboard.activity.empty')),
    });

    const { data: organizations = [], isLoading: orgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await api.get('/crm/organizations');
            if (!res.ok) throw new Error(t('common.error'));
            const json = await res.json();
            return Array.isArray(json) ? json : json.data || [];
        },
        onError: () => toast.error(t('common.error')),
    });

    const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
        queryKey: ['audit'],
        queryFn: async () => {
            const res = await api.get('/audit?limit=25'); 
            if (!res.ok) return []; 
            const json = await res.json();
            return Array.isArray(json) ? json : json.data || [];
        },
    });

    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            return []; // Temporarily disabled until /billing/payments API is built
        },
    });

    const { data: prospects = [], isLoading: prospectsLoading } = useProspects();

    const loading = licensesLoading || orgsLoading || auditLoading || paymentsLoading || prospectsLoading;

    if (loading) return <div className="p-10"><Skeleton className="h-[600px] w-full" /></div>;

    // 2. Cálculos para Tarjetas de Resumen Rápido
    const totalOrganizations = organizations?.length || 0;
    const totalLicenses = licenses?.length || 0;
    const totalProspects = prospects?.length || 0;
    
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
    
    const masterLogsSlice = Array.isArray(auditLogs) && auditLogs.length > 0
        ? auditLogs.filter(log => log.user?.role === 'MASTER' || log.user?.tipo === 'MASTER' || true).slice(0, 20)
        : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t('dashboard.stats.organizations')} value={totalOrganizations} icon={Building2} color="bg-blue-500/10 text-blue-600" />
                <StatCard title={t('dashboard.stats.totalLicenses')} value={totalLicenses} icon={Key} color="bg-indigo-500/10 text-indigo-600" />
                <StatCard title={t('dashboard.stats.inactiveLicenses')} value={inactiveLicenses} icon={Ban} color="bg-slate-500/10 text-slate-600" />
                <StatCard title={t('dashboard.stats.pendingActivation')} value={pendingActivation} icon={Clock} color="bg-orange-500/10 text-orange-600" />
                
                <StatCard title={t('dashboard.stats.activationsToday')} value={activatedToday} icon={Activity} color="bg-emerald-500/10 text-emerald-600" />
                <StatCard title={t('dashboard.stats.expiringSoon')} value={expiringIn15DaysCount} icon={AlertTriangle} color="bg-yellow-500/10 text-yellow-600" />
                <StatCard title={t('dashboard.stats.expired')} value={expiredLicenses} icon={CalendarX} color="bg-rose-500/10 text-rose-600" />
                <StatCard title={t('dashboard.stats.totalProspects')} value={totalProspects} icon={Users} color="bg-purple-500/10 text-purple-600" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            {t('dashboard.alerts.title')}
                        </CardTitle>
                        <CardDescription>{t('dashboard.alerts.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">{t('dashboard.alerts.expirationsTitle')}</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dashboard.alerts.table.organization')}</TableHead>
                                            <TableHead>{t('dashboard.alerts.table.expiration')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {alertsExpiringList.length === 0 ? (
                                            <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">{t('dashboard.alerts.noExpirations')}</TableCell></TableRow>
                                        ) : alertsExpiringList.map(lic => (
                                            <TableRow key={lic.id}>
                                                <TableCell className="font-medium">{lic.organization?.name || t('common.na')}</TableCell>
                                                <TableCell className="text-yellow-600 dark:text-yellow-500 font-semibold">{format(new Date(lic.expirationDate), 'dd MMM yyyy', { locale: dateLocale })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">{t('dashboard.alerts.paymentsTitle')}</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dashboard.alerts.table.organization')}</TableHead>
                                            <TableHead>{t('dashboard.alerts.table.amount')}</TableHead>
                                            <TableHead>{t('dashboard.alerts.table.date')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPayments.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">{t('dashboard.alerts.noPayments')}</TableCell></TableRow>
                                        ) : recentPayments.map((pay, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{pay.organizationName || t('common.na')}</TableCell>
                                                <TableCell className="text-emerald-600 font-medium">${pay.amount}</TableCell>
                                                <TableCell>{format(new Date(pay.date || pay.createdAt), 'dd MMM yyyy', { locale: dateLocale })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-blue-500" />
                                {t('dashboard.infrastructure.title')}
                            </CardTitle>
                            <CardDescription>{t('dashboard.infrastructure.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <div className="flex-1 bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                                    <Server className="h-8 w-8 text-emerald-500 mb-1" />
                                    <p className="font-semibold text-sm">{t('dashboard.infrastructure.servers')}</p>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">{t('dashboard.infrastructure.serversStatus')}</Badge>
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                                    <Globe className="h-8 w-8 text-emerald-500 mb-1" />
                                    <p className="font-semibold text-sm">{t('dashboard.infrastructure.domains')}</p>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">{t('dashboard.infrastructure.domainsStatus')}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                {t('dashboard.activity.title')}
                            </CardTitle>
                            <CardDescription>{t('dashboard.activity.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {masterLogsSlice.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.activity.empty')}</p>
                                ) : (
                                    masterLogsSlice.map((log, i) => (
                                        <div key={i} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                                            </div>
                                            <div className="flex-1">
                                                <p><span className="font-medium">{log.userName || t('dashboard.activity.admin')}</span> {t(`audit.actions.${log.action}`, { defaultValue: log.action || t('dashboard.activity.action') })} <span className="font-medium text-foreground/80">{log.entityName || t('dashboard.activity.system')}</span></p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: dateLocale })}</p>
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
