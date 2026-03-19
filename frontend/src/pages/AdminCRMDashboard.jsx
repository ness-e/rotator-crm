/**
 * @file AdminCRMDashboard.jsx
 * @description Componente de página (Vista) para la sección AdminCRMDashboard.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminCRMDashboard.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import {
    DollarSign, TrendingUp, Users, AlertTriangle, Calendar,
    RefreshCw, ArrowUpRight, ArrowDownRight, Target
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminCRMDashboard() {
    const { toast } = useToast()
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMetrics()
    }, [])

    const loadMetrics = async () => {
        setLoading(true)
        try {
            const res = await api.get('/crm/metrics')
            if (res.ok) {
                const data = await res.json()
                setMetrics(data)
            } else {
                throw new Error('Failed to load metrics')
            }
        } catch (error) {
            console.error('Error loading CRM metrics:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las métricas CRM',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground animate-pulse">Cargando métricas CRM...</div>
            </div>
        )
    }

    if (!metrics) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>No se pudieron cargar las métricas. Intenta recargar la página.</AlertDescription>
            </Alert>
        )
    }

    const { financial, retention, customers, alerts } = metrics

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: financial.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    // Prepare data for charts
    const licenseTypeData = Object.entries(customers.licensesByType || {}).map(([name, value]) => ({
        name,
        value
    }))

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        CRM Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">Métricas financieras y de retención en tiempo real</p>
                </div>
                <Button onClick={loadMetrics} variant="outline" className="rounded-xl">
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-blue-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">MRR</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">{formatCurrency(financial.mrr)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ingresos recurrentes mensuales</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-emerald-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">ARR</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">{formatCurrency(financial.arr)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ingresos recurrentes anuales</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-amber-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                                <Target className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">LTV</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">{formatCurrency(financial.ltv)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Lifetime Value</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-indigo-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">ARPU</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">{formatCurrency(financial.arpu)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ingreso promedio por usuario</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Retention Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <RefreshCw className="h-5 w-5 text-emerald-500" />
                            Tasa de Renovación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-emerald-600">{retention.renewalRate.toFixed(1)}%</span>
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Clientes que renovaron</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                            Churn Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-rose-600">{retention.churnRate.toFixed(1)}%</span>
                            <ArrowDownRight className="h-5 w-5 text-rose-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Pérdida de clientes</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-yellow-500" />
                            Por Vencer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-yellow-600">{retention.expiringSoon}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Próximos 30 días</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Distribución por Plan</CardTitle>
                        <CardDescription>Total de licencias activas por tipo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                <PieChart>
                                    <Pie
                                        data={licenseTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {licenseTypeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Estado de Licencias</CardTitle>
                        <CardDescription>Activas vs Expiradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{retention.activeLicenses}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Licencias Activas</p>
                                        <p className="text-xs text-muted-foreground">Vigentes actualmente</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{retention.expiredLicenses}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Licencias Expiradas</p>
                                        <p className="text-xs text-muted-foreground">Requieren renovación</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{retention.expiringSoon}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Por Vencer Pronto</p>
                                        <p className="text-xs text-muted-foreground">Próximos 30 días</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expiring Soon Alert */}
            {alerts.expiringSoon && alerts.expiringSoon.length > 0 && (
                <Card className="rounded-2xl border-yellow-500 border-2 shadow-xl">
                    <CardHeader className="bg-yellow-50 dark:bg-yellow-900/10">
                        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                            <AlertTriangle className="h-5 w-5" />
                            Alertas de Vencimiento - Customer Success
                        </CardTitle>
                        <CardDescription>Clientes que requieren atención inmediata</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {alerts.expiringSoon.slice(0, 10).map((alert) => (
                                <div key={alert.id_licencia} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{alert.organization || 'Sin organización'}</p>
                                        <p className="text-xs text-muted-foreground">{alert.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={alert.daysUntilExpiry <= 7 ? 'destructive' : 'outline'} className="font-bold">
                                            {alert.daysUntilExpiry} día{alert.daysUntilExpiry !== 1 ? 's' : ''}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Vence: {new Date(alert.licencia_expira).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Customer Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Resumen de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <span className="text-sm font-medium">Total de Usuarios</span>
                            <span className="text-lg font-bold">{customers.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <span className="text-sm font-medium">Total de Licencias</span>
                            <span className="text-lg font-bold">{customers.totalLicenses}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <span className="text-sm font-medium">País Principal</span>
                            <span className="text-lg font-bold">{customers.topCountry}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <span className="text-sm font-medium">Plan Más Vendido</span>
                            <span className="text-lg font-bold">{customers.topPlan}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Métricas Clave</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <span className="text-sm font-medium">Tasa de Conversión</span>
                            <span className="text-lg font-bold text-blue-600">
                                {customers.totalUsers > 0 ? ((customers.totalLicenses / customers.totalUsers) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <span className="text-sm font-medium">Retención</span>
                            <span className="text-lg font-bold text-emerald-600">{retention.renewalRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                            <span className="text-sm font-medium">Churn</span>
                            <span className="text-lg font-bold text-rose-600">{retention.churnRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <span className="text-sm font-medium">Valor Promedio</span>
                            <span className="text-lg font-bold text-amber-600">{formatCurrency(financial.arpu)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
