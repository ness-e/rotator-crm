/**
 * @file Dashboard.jsx
 * @description Componente de página (Vista) para la sección Dashboard.
 * @module Frontend Page
 * @path /frontend/src/pages/Dashboard.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, KeySquare, Activity, TrendingUp, AlertTriangle, Calendar, Globe, Copy, BarChart3, PieChart, Map, Award, ArrowUpRight, ArrowDownRight, List } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { FilterBar } from '@/components/FilterBar';
import { DataTable } from '@/components/DataTable';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RePie, Pie, Cell, AreaChart, Area } from 'recharts';
import AdminCRMDashboard from './AdminCRMDashboard'; // Import CRM Dashboard

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const MetricCard = ({ title, value, icon: Icon, trend, color, subtext }) => (
    <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
        <div className={`h-1 ${color.split(' ')[0].replace('bg-', 'bg-').split('/')[0]}`} />
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-50 truncate" title={value}>{value}</p>
                </div>
                {subtext && <span className="text-xs text-muted-foreground block mt-1">{subtext}</span>}
            </div>
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showExpiringDetails, setShowExpiringDetails] = useState(false);

    // Fetch licenses (Main Data Source)
    const { data: licenses = [], isLoading: licensesLoading, refetch: refetchLicenses } = useQuery({
        queryKey: ['licenses'],
        queryFn: async () => {
            const res = await api.get('/licenses');
            if (!res.ok) throw new Error('Error al cargar licencias');
            return res.json(); // Returns License[] with Organization
        },
        onError: () => toast.error('Error al cargar licencias'),
    });

    // Fetch users count (Just for stats)
    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            if (!res.ok) throw new Error('Error users');
            return res.json();
        }
    });

    const loading = licensesLoading || usersLoading;

    const loadData = () => {
        refetchLicenses();
    };

    // ============ METRICS CALCULATIONS ============
    const totalUsers = users.length;

    // In new model, a license belongs to an Org, not a specific single user (though Org has users).
    // We count Licenses.
    const totalLicenses = licenses.length;
    const now = new Date();

    const activeLicenses = licenses.filter(l => l.status === 'ACTIVE' && (!l.expirationDate || new Date(l.expirationDate) > now));
    const expiredLicenses = licenses.filter(l => l.status === 'EXPIRED' || (l.expirationDate && new Date(l.expirationDate) < now));
    const activeCount = activeLicenses.length;
    const expiredCount = expiredLicenses.length;

    // Expiring logic
    const expiringLicenses = licenses.filter(l => {
        if (!l.expirationDate) return false;
        const daysUntil = Math.ceil((new Date(l.expirationDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 30;
    });
    const expiringCount = expiringLicenses.length;

    // Type Dist
    const typeCount = licenses.reduce((acc, curr) => {
        const t = curr.hostingType || 'Unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});
    const licensesByType = Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] }));

    let topPlan = '-';
    let maxPlanCount = 0;
    Object.entries(typeCount).forEach(([name, count]) => {
        if (count > maxPlanCount) { maxPlanCount = count; topPlan = name; }
    });

    // Geo Dist (Based on Org Country? or User?)
    // License -> Organization -> countryCode
    // We need to fetch Organization details. The license list usually includes { organization: {...} }
    const countryCount = licenses.reduce((acc, curr) => {
        const code = curr.organization?.countryCode || 'XX';
        acc[code] = (acc[code] || 0) + 1;
        return acc;
    }, {});
    const itemsByCountry = Object.keys(countryCount).map(k => ({ name: k, value: countryCount[k] })).sort((a, b) => b.value - a.value);

    let topCountry = itemsByCountry[0]?.name || '-';

    // Table Data
    const filteredLicenses = licenses.filter(lic => {
        const orgName = lic.organization?.name?.toLowerCase() || '';
        const serial = lic.serialKey?.toLowerCase() || '';
        const search = searchValue.toLowerCase();
        const matchesSearch = !search || orgName.includes(search) || serial.includes(search);

        const isExpired = lic.expirationDate && new Date(lic.expirationDate) < now;
        const isActive = !isExpired && lic.status === 'ACTIVE';

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'expired' && isExpired);

        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            key: 'organization', label: 'Organización', render: (_, row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{row.organization?.name || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">{row.organization?.countryCode}</span>
                </div>
            )
        },
        { key: 'serialKey', label: 'Serial Key', render: (v) => <span className="font-mono text-xs">{v}</span> },
        {
            key: 'expirationDate', label: 'Vencimiento', render: (v) => {
                if (!v) return <Badge variant="outline">Vitalicia</Badge>;
                const isExpired = new Date(v) < now;
                return <Badge variant={isExpired ? 'destructive' : 'outline'}>{new Date(v).toLocaleDateString()}</Badge>;
            }
        },
        {
            key: 'status', label: 'Estado', render: (_, row) => {
                if (row.status === 'ACTIVE') return <Badge className="bg-emerald-500">Activa</Badge>;
                return <Badge variant="destructive">{row.status}</Badge>;
            }
        },
        {
            key: 'actions', label: 'Acciones', render: (_, row) => (
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(row.serialKey)}>
                    <Copy className="h-4 w-4" />
                </Button>
            )
        }
    ];

    if (loading) return <div className="p-10"><Skeleton className="h-96 w-full" /></div>;

    return (
        <PageLayout
            title="Dashboard"
            subtitle="Vista General de Licencias"
            tabs={[
                { value: 'overview', label: 'General', icon: List },
                { value: 'stats', label: 'Estadísticas', icon: TrendingUp }
            ]}
            defaultTab="overview"
        >

            <PageLayoutTab value="overview">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <MetricCard title="Total Licencias" value={totalLicenses} icon={KeySquare} color="bg-blue-500/10 text-blue-600" />
                    <MetricCard title="Activas" value={activeCount} icon={Activity} color="bg-emerald-500/10 text-emerald-600" />
                    <MetricCard title="Expiradas" value={expiredCount} icon={AlertTriangle} color="bg-rose-500/10 text-rose-600" />
                    <MetricCard title="Por Vencer" value={expiringCount} icon={Calendar} color="bg-yellow-500/10 text-yellow-600" />
                </div>

                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Licencias & Clientes</CardTitle>
                        <CardDescription>Listado unificado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FilterBar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            filters={[
                                { type: 'select', name: 'status', value: statusFilter, options: [{ value: 'active', label: 'Activas' }, { value: 'expired', label: 'Vencidas' }] }
                            ]}
                            onFilterChange={(n, v) => setStatusFilter(v)}
                            onClearFilters={() => { setSearchValue(''); setStatusFilter(''); }}
                        />
                        <div className="mt-4">
                            <DataTable columns={columns} data={filteredLicenses} />
                        </div>
                    </CardContent>
                </Card>
            </PageLayoutTab>

            <PageLayoutTab value="stats">
                <AdminCRMDashboard />
            </PageLayoutTab>
        </PageLayout>
    );
}
