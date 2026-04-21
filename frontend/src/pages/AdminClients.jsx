/**
 * @file AdminClients.jsx
 * @description Componente de página (Vista) para la sección AdminClients.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminClients.jsx
 * @lastUpdated 2026-03-23
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useApi';
import { getRenewalStatusColor, getRenewalStatusLabel } from '@/constants/renewalStatus';
import { Search, MoreHorizontal, Users, AlertCircle, Globe2, Building2, Calendar, Mail, Server, Plus, Filter, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminClients() {
    const { data, isLoading: loading } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const stats = data?.stats || null;
    const users = data?.users || [];

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.organizacion_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.correo_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesStatus = statusFilter === 'all' 
            ? true 
            : statusFilter === 'active' 
                ? u.renewal_status === 'active' || u.renewal_status === 'active_near_expiry'
                : statusFilter === 'expired'
                    ? u.renewal_status === 'expired'
                    : statusFilter === 'warning'
                        ? u.renewal_status === 'warning' || u.renewal_status === 'near_expiry'
                        : true;
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading || !stats) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="h-7 w-7 text-indigo-500" />
                        Clientes Activos
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestiona tu cartera de clientes y monitoriza el estado de sus licencias y servidores.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar cliente, email..." 
                                className="pl-9 w-full sm:w-[260px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 transition-all focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                    <SelectValue placeholder="Estado" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activos</SelectItem>
                                <SelectItem value="warning">Por Vencer</SelectItem>
                                <SelectItem value="expired">Expirados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => navigate('/admin/crm/clients/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none w-full sm:w-auto transition-transform active:scale-95">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 group cursor-default">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-indigo-100 text-sm font-medium flex items-center gap-2">
                                    Total Clientes
                                </p>
                                <p className="text-4xl font-black tracking-tighter">{users.length}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 group cursor-default">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-rose-100 text-sm font-medium flex items-center gap-2">
                                    Licencias Expiradas
                                </p>
                                <p className="text-4xl font-black tracking-tighter">{stats.period?.notRenewed || 0}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 group cursor-default">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-emerald-100 text-sm font-medium flex items-center gap-2">
                                    Estado Global
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Activity className="h-5 w-5 text-emerald-200 animate-pulse" />
                                    <p className="text-2xl font-black tracking-tighter">Estable</p>
                                </div>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                <Globe2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-500" />
                        Directorio de Organizaciones
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {filteredUsers.length} resultados
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[600px] relative">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-slate-100 dark:border-slate-800">
                                <TableHead className="w-[300px] font-bold text-slate-600 dark:text-slate-400">Empresa / Contacto</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-400">Estado</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-400">Plan & Servidor</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-400">Ubicación</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-[400px] text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                                                <Search className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">No se encontraron resultados</p>
                                                <p className="text-sm">Prueba ajustando los filtros o términos de búsqueda.</p>
                                            </div>
                                            {(searchTerm !== '' || statusFilter !== 'all') && (
                                                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="mt-2">
                                                    Limpiar filtros
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentUsers.map((u, i) => (
                                    <TableRow key={u.id_cliente} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                                    <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                                                        {u.organizacion_cliente ? u.organizacion_cliente.substring(0, 2).toUpperCase() : 'NA'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={u.organizacion_cliente}>
                                                        {u.organizacion_cliente || 'Sin Organización'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate max-w-[150px]" title={u.correo_cliente}>{u.correo_cliente}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 items-start">
                                                {u.renewal_status ? (
                                                    <Badge className={`${getRenewalStatusColor(u.renewal_status)} text-white font-medium px-2.5 py-0.5 shadow-sm`}>
                                                        {getRenewalStatusLabel(u.renewal_status)}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground bg-slate-100 dark:bg-slate-800">Sin Licencia</Badge>
                                                )}
                                                {u.license?.licencia_expira && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                        <Calendar className="h-3 w-3" />
                                                        Vence: {u.license.licencia_expira}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {u.license?.licencia_tipo || 'Ninguno'}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Server className="h-3 w-3" />
                                                    {u.license?.hosting ? 'Cloud Hosting' : 'On-Premise Local'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {u.country?.name || u.pais_cliente}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {u.ciudad_cliente || 'Ciudad no espec.'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                                                    onClick={() => navigate(`/admin/crm/clients/${u.id_cliente}`)}
                                                >
                                                    Ver Detalle
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-lg border-slate-100 dark:border-slate-800">
                                                        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                                        <DropdownMenuItem 
                                                            className="font-medium cursor-pointer focus:bg-indigo-50 focus:text-indigo-700 dark:focus:bg-indigo-900/30 dark:focus:text-indigo-300"
                                                            onClick={() => navigate(`/admin/crm/clients/${u.id_cliente}`)}
                                                        >
                                                            Abrir Ficha
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium">
                            Mostrando <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="text-slate-900 dark:text-white">{filteredUsers.length}</span> resultados
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    // Logic to show pages around current page
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 2 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-8 w-8 rounded-lg ${currentPage === pageNum ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
