/**
 * @file GeographicMetrics.jsx
 * @description Componente de página (Vista) para la sección GeographicMetrics.
 * @module Frontend Page
 * @path /frontend/src/pages/GeographicMetrics.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Globe, TrendingDown, Users, MapPin } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function GeographicMetrics() {
    const { toast } = useToast()
    const [churnByCountry, setChurnByCountry] = useState([])
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [churnRes, metricsRes] = await Promise.all([
                api.get('/crm/churn-by-country'),
                api.get('/crm/metrics')
            ])

            if (churnRes.ok) setChurnByCountry(await churnRes.json())
            if (metricsRes.ok) setMetrics(await metricsRes.json())
        } catch (error) {
            console.error('Error loading geographic data:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los datos geográficos',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground animate-pulse">Cargando análisis geográfico...</div>
            </div>
        )
    }

    const usersByCountry = metrics?.customers?.usersByCountry || {}
    const countryData = Object.entries(usersByCountry).map(([country, count]) => ({
        country,
        users: count,
        churn: churnByCountry.find(c => c.country === country)?.churnRate || 0
    })).sort((a, b) => b.users - a.users)

    const topCountries = countryData.slice(0, 10)

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <Globe className="h-8 w-8 text-primary" />
                    Análisis Geográfico
                </h2>
                <p className="text-muted-foreground mt-1">Distribución y métricas por país</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-blue-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                                <Globe className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Países Activos</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">
                                {Object.keys(usersByCountry).length}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Con clientes registrados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-emerald-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <MapPin className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">País Principal</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">
                                {metrics?.customers?.topCountry || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {topCountries[0]?.users || 0} clientes
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-rose-500" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mayor Churn</p>
                            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-50">
                                {churnByCountry[0]?.country || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {churnByCountry[0]?.churnRate?.toFixed(1) || 0}% de pérdida
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Country */}
                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Top 10 Países por Clientes</CardTitle>
                        <CardDescription>Distribución de usuarios activos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            {topCountries.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topCountries} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="country" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="users" fill="#3b82f6" name="Clientes" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos disponibles</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Churn by Country */}
                <Card className="rounded-2xl border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Churn Rate por País</CardTitle>
                        <CardDescription>Tasa de pérdida de clientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            {churnByCountry.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={churnByCountry.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="country" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="churnRate" fill="#ef4444" name="Churn %" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos disponibles</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="rounded-2xl border-none shadow-xl">
                <CardHeader>
                    <CardTitle>Análisis Detallado por País</CardTitle>
                    <CardDescription>Métricas completas de cada mercado</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-semibold">País</th>
                                    <th className="text-right p-3 font-semibold">Clientes</th>
                                    <th className="text-right p-3 font-semibold">Churn Rate</th>
                                    <th className="text-right p-3 font-semibold">% del Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countryData.map((item) => {
                                    const totalUsers = metrics?.customers?.totalUsers || 1
                                    const percentage = ((item.users / totalUsers) * 100).toFixed(1)

                                    return (
                                        <tr key={item.country} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                                            <td className="p-3 font-medium">{item.country}</td>
                                            <td className="p-3 text-right">{item.users}</td>
                                            <td className="p-3 text-right">
                                                <span className={`font-semibold ${item.churn > 20 ? 'text-rose-600' : item.churn > 10 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                                    {item.churn.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-muted-foreground">{percentage}%</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Insights */}
            <Card className="rounded-2xl border-none shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Insights Geográficos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                        <p className="text-sm">
                            <strong>Concentración:</strong> El {((topCountries.slice(0, 3).reduce((sum, c) => sum + c.users, 0) / (metrics?.customers?.totalUsers || 1)) * 100).toFixed(1)}%
                            de tus clientes están en los 3 países principales
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                        <p className="text-sm">
                            <strong>Oportunidad:</strong> {Object.keys(usersByCountry).length} mercados activos con potencial de crecimiento
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500 mt-2" />
                        <p className="text-sm">
                            <strong>Atención:</strong> {churnByCountry.filter(c => c.churnRate > 15).length} países con churn rate superior al 15%
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
