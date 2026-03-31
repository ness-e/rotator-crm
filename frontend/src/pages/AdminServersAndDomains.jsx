import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import {
    Server, Globe, Plus, Edit, Trash2, Search, HardDrive,
    Network, Building2, ChevronDown, ChevronRight, DollarSign,
    Calendar, Activity, Layers, Cpu, AlertCircle,
    Key, Copy, Eye, EyeOff, Check, Lock, FolderOpen,
    Loader2, RotateCcw, XCircle, Wifi, Stethoscope,
    CheckCircle2, AlertTriangle, ShieldAlert, Info, Globe2
} from 'lucide-react'
import { SERVER_TYPES, getServerTypeName } from '@/constants/serverTypes'
import { ProviderCatalog } from '@/components/ProviderCatalog'

// ─── Helpers ───────────────────────────────────────────────────────────────
const SERVER_STATUS_OPTIONS = [
    { value: 'active', label: 'Activo', color: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactivo', color: 'bg-slate-400' },
    { value: 'maintenance', label: 'Mantenimiento', color: 'bg-amber-500' },
]
const BILLING_CYCLES = [
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUAL', label: 'Semestral' },
    { value: 'ANNUAL', label: 'Anual' },
]
const CURRENCIES = ['USD', 'EUR', 'COP', 'MXN', 'ARS']
const DOMAIN_STATUS_OPTIONS = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'expired', label: 'Expirado' },
]

const emptyServer = {
    name: '', type: '0', ipAddress: '', status: 'active',
    providerId: 'none', providerPlanId: 'none', organizationId: '',
    costMonthly: '', costAnnual: '', currency: 'USD', billingCycle: 'MONTHLY',
    nextPaymentDate: '', size: '', capacity: '100', observations: '',
    primaryDomain: '',
}

const emptyDomain = {
    domainName: '', status: 'active', expiresAt: '', observations: '',
    appName: '', ftpAddress: '', ftpUser: '', ftpPassword: '',
}

export default function AdminServersAndDomains() {
    const { toast } = useToast()
    const [servers, setServers] = useState([])
    const [providers, setProviders] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [serverDialog, setServerDialog] = useState({ open: false, mode: 'create', data: { ...emptyServer } })
    const [domainDialog, setDomainDialog] = useState({ open: false, mode: 'create', data: { ...emptyDomain }, serverId: null, serverName: '' })
    const [expandedServers, setExpandedServers] = useState({})
    const [ftpSheet, setFtpSheet] = useState({ open: false, domain: null, password: null, showPassword: false, loading: false, copied: {} })
    // domainHealth: { [domainId]: { status: 'checking'|'up'|'down', latencyMs, checkedAt, errorMessage } }
    const [domainHealth, setDomainHealth] = useState({})
    // diagnosticsDialog: { open, serverId, serverName, loading, data, error }
    const [diagnosticsDialog, setDiagnosticsDialog] = useState({ open: false, serverId: null, serverName: '', loading: false, data: null, error: null })

    useEffect(() => { loadData() }, [])

    const checkDomainHealth = async (domainId) => {
        setDomainHealth(h => ({ ...h, [domainId]: { status: 'checking' } }))
        try {
            const res = await api.get(`/domains/${domainId}/health`)
            if (res.ok) {
                const data = await res.json()
                setDomainHealth(h => ({
                    ...h,
                    [domainId]: {
                        status: data.healthy ? 'up' : 'down',
                        latencyMs: data.latencyMs,
                        statusCode: data.statusCode,
                        errorMessage: data.errorMessage,
                        checkedAt: data.checkedAt
                    }
                }))
            } else {
                setDomainHealth(h => ({ ...h, [domainId]: { status: 'down', errorMessage: 'Error del servidor' } }))
            }
        } catch {
            setDomainHealth(h => ({ ...h, [domainId]: { status: 'down', errorMessage: 'Sin conexión' } }))
        }
    }

    const checkAllDomainsForServer = (server) => {
        if (server.domains?.length) {
            server.domains.forEach(d => checkDomainHealth(d.id))
        }
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const [serversRes, orgsRes, provsRes] = await Promise.all([
                api.get('/servers'),
                api.get('/crm/organizations'),
                api.get('/providers')
            ])
            if (serversRes.ok) setServers(await serversRes.json())
            if (orgsRes.ok) setOrganizations(await orgsRes.json())
            if (provsRes.ok) setProviders(await provsRes.json())
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const openServerDialog = (mode, server = null) => {
        if (mode === 'create') {
            setServerDialog({ open: true, mode, data: { ...emptyServer } })
        } else {
            setServerDialog({
                open: true, mode, data: {
                    name: server.name || '',
                    type: String(server.type ?? '0'),
                    ipAddress: server.ipAddress || '',
                    status: server.status || 'active',
                    providerId: server.providerId ? String(server.providerId) : 'none',
                    providerPlanId: server.providerPlanId ? String(server.providerPlanId) : 'none',
                    organizationId: server.organizationId ? String(server.organizationId) : '',
                    costMonthly: server.costMonthly != null ? String(server.costMonthly) : '',
                    costAnnual: server.costAnnual != null ? String(server.costAnnual) : '',
                    currency: server.currency || 'USD',
                    billingCycle: server.billingCycle || 'MONTHLY',
                    nextPaymentDate: server.nextPaymentDate ? new Date(server.nextPaymentDate).toISOString().split('T')[0] : '',
                    size: server.size || '',
                    capacity: server.capacity != null ? String(server.capacity) : '100',
                    observations: server.observations || '',
                    primaryDomain: server.primaryDomain || '',
                    _id: server.id,
                }
            })
        }
    }

    const openDomainDialog = (mode, serverId, serverName, domain = null) => {
        setDomainDialog({
            open: true, mode, serverId, serverName,
            data: domain ? {
                domainName: domain.domainName || '',
                status: domain.status || 'active',
                expiresAt: domain.expiresAt ? new Date(domain.expiresAt).toISOString().split('T')[0] : '',
                observations: domain.observations || '',
                appName: domain.appName || '',
                ftpAddress: domain.ftpAddress || '',
                ftpUser: domain.ftpUser || '',
                ftpPassword: '', // never pre-fill password
                hasFtpPassword: domain.hasFtpPassword || false,
                _id: domain.id,
            } : { ...emptyDomain }
        })
    }

    const openFtpSheet = async (domain) => {
        setFtpSheet({ open: true, domain, password: null, showPassword: false, loading: false, copied: {} })
    }

    const revealFtpPassword = async () => {
        setFtpSheet(s => ({ ...s, loading: true }))
        try {
            const res = await api.get(`/domains/${ftpSheet.domain.id}/ftp-password`)
            if (res.ok) {
                const { password } = await res.json()
                setFtpSheet(s => ({ ...s, password, loading: false }))
            }
        } catch {
            setFtpSheet(s => ({ ...s, loading: false }))
        }
    }

    const copyToClipboard = async (key, text) => {
        if (!text) return
        await navigator.clipboard.writeText(text)
        setFtpSheet(s => ({ ...s, copied: { ...s.copied, [key]: true } }))
        setTimeout(() => setFtpSheet(s => ({ ...s, copied: { ...s.copied, [key]: false } })), 2000)
    }

    const handleSaveServer = async (e) => {
        e.preventDefault()
        const d = serverDialog.data
        const payload = {
            name: d.name,
            type: d.type,
            ipAddress: d.ipAddress || null,
            status: d.status,
            providerId: d.providerId !== 'none' && d.providerId ? parseInt(d.providerId) : null,
            providerPlanId: d.providerPlanId !== 'none' && d.providerPlanId ? parseInt(d.providerPlanId) : null,
            organizationId: (d.type === '1' || d.type === '2') && d.organizationId ? parseInt(d.organizationId) : null,
            costMonthly: d.costMonthly ? Number(d.costMonthly) : 0,
            costAnnual: d.costAnnual ? Number(d.costAnnual) : 0,
            currency: d.currency,
            billingCycle: d.billingCycle,
            nextPaymentDate: d.nextPaymentDate || null,
            size: d.size || null,
            capacity: d.capacity ? parseInt(d.capacity) : 100,
            observations: d.observations || null,
            primaryDomain: d.primaryDomain || null,
        }
        try {
            const res = serverDialog.mode === 'create'
                ? await api.post('/servers', payload)
                : await api.put(`/servers/${d._id}`, payload)
            if (res.ok) {
                toast({ title: 'Éxito', description: `Servidor ${serverDialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setServerDialog({ open: false, mode: 'create', data: { ...emptyServer } })
                loadData()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al guardar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleDeleteServer = async (id) => {
        if (!confirm('¿Eliminar este servidor? También se eliminarán sus relaciones con licencias.')) return
        try {
            const res = await api.delete(`/servers/${id}`)
            if (res.ok) {
                toast({ title: 'Servidor eliminado' })
                loadData()
            }
        } catch {
            toast({ title: 'Error al eliminar', variant: 'destructive' })
        }
    }

    const handleSaveDomain = async (e) => {
        e.preventDefault()
        const d = domainDialog.data
        const payload = {
            domainName: d.domainName,
            serverId: domainDialog.serverId || null,
            status: d.status,
            expiresAt: d.expiresAt || null,
            observations: d.observations || null,
            appName: d.appName || null,
            ftpAddress: d.ftpAddress || null,
            ftpUser: d.ftpUser || null,
            ftpPassword: d.ftpPassword || undefined,
        }
        try {
            const res = domainDialog.mode === 'create'
                ? await api.post('/domains', payload)
                : await api.put(`/domains/${d._id}`, payload)
            if (res.ok) {
                toast({ title: 'Éxito', description: `Dominio ${domainDialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setDomainDialog({ open: false, mode: 'create', data: { ...emptyDomain }, serverId: null, serverName: '' })
                loadData()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al guardar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleDeleteDomain = async (id) => {
        if (!confirm('¿Eliminar este dominio?')) return
        try {
            await api.delete(`/domains/${id}`)
            toast({ title: 'Dominio eliminado' })
            loadData()
        } catch {
            toast({ title: 'Error al eliminar', variant: 'destructive' })
        }
    }

    const updateServerField = (field, value) =>
        setServerDialog(d => ({ ...d, data: { ...d.data, [field]: value } }))

    const runDiagnostics = async (server) => {
        setDiagnosticsDialog({ open: true, serverId: server.id, serverName: server.name, loading: true, data: null, error: null })
        try {
            const res = await api.get(`/servers/${server.id}/diagnostics`)
            if (res.ok) {
                const data = await res.json()
                setDiagnosticsDialog(d => ({ ...d, loading: false, data }))
            } else {
                const err = await res.json()
                setDiagnosticsDialog(d => ({ ...d, loading: false, error: err.error || 'Error al obtener diagnóstico' }))
            }
        } catch (e) {
            setDiagnosticsDialog(d => ({ ...d, loading: false, error: e.message || 'Sin conexión' }))
        }
    }

    const updateDomainField = (field, value) =>
        setDomainDialog(d => ({ ...d, data: { ...d.data, [field]: value } }))

    const getStatusDot = (status) => {
        const colors = { active: 'bg-emerald-500', inactive: 'bg-slate-400', maintenance: 'bg-amber-500', expired: 'bg-red-500' }
        return <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || 'bg-slate-400'} shadow-sm`} />
    }

    const getStatusLabel = (status) => {
        const labels = { active: 'Activo', inactive: 'Inactivo', maintenance: 'Mantenimiento', expired: 'Expirado' }
        return labels[status] || status
    }

    const isExpiringSoon = (dateString) => {
        if (!dateString) return false
        const diff = (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 30
    }

    const filteredServers = servers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ipAddress && s.ipAddress.includes(searchTerm)) ||
        (s.providerRef?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Derived state for provider/plan selects in server form
    const sf = serverDialog.data
    const selectedProvider = providers.find(p => String(p.id) === sf.providerId)
    const availablePlans = selectedProvider?.plans?.filter(p => p.isActive) || []
    const showOrgSelect = sf.type === '1' || sf.type === '2'

    // Stats
    const activeServers = servers.filter(s => s.status === 'active').length
    const totalDomains = servers.reduce((acc, s) => acc + (s.domains?.length || 0), 0)
    const expiringSoonPayments = servers.filter(s => isExpiringSoon(s.nextPaymentDate)).length

    return (
        <div className="w-full px-4 py-10 space-y-8 animate-in fade-in duration-400">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Server className="h-7 w-7 text-primary" />
                        </div>
                        Infraestructura
                    </h1>
                    <p className="text-muted-foreground mt-2 ml-1">Servidores, dominios y catálogo de proveedores</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar servidor, IP, proveedor..."
                        className="pl-9 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="servers" className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-xl">
                    <TabsTrigger value="servers" className="rounded-lg">Servidores y Dominios</TabsTrigger>
                    <TabsTrigger value="providers" className="rounded-lg">Catálogo de Proveedores</TabsTrigger>
                </TabsList>

                {/* ══════════ SERVERS TAB ══════════ */}
                <TabsContent value="servers" className="space-y-6 pt-5">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Server, label: 'Total Servidores', value: servers.length, color: 'blue' },
                            { icon: Activity, label: 'Activos', value: activeServers, color: 'emerald' },
                            { icon: Globe, label: 'Dominios', value: totalDomains, color: 'indigo' },
                            { icon: AlertCircle, label: 'Pago próximo', value: expiringSoonPayments, color: 'amber' },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className={`bg-${color}-50 dark:bg-${color}-950/30 border border-${color}-100 dark:border-${color}-900/50 rounded-xl p-4 flex items-center gap-3`}>
                                <div className={`p-2 bg-${color}-500/15 rounded-lg flex-shrink-0`}>
                                    <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300`}>{value}</p>
                                    <p className={`text-xs text-${color}-600/70 dark:text-${color}-400/70`}>{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Servers List Header */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Layers className="h-5 w-5 text-blue-500" />
                            Vista Jerárquica
                            <Badge variant="secondary" className="ml-1">{filteredServers.length}</Badge>
                        </h2>
                        <Button className="rounded-xl shadow-sm" onClick={() => openServerDialog('create')}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Servidor
                        </Button>
                    </div>

                    {/* Servers List */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredServers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                            <Server className="h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium text-lg">No se encontraron servidores</p>
                            <p className="text-sm text-slate-400 mt-1">Añade tu primer servidor con el botón superior</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredServers.map(server => (
                                <Card key={server.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Server Row */}
                                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={() => {
                                                    const opening = !expandedServers[server.id]
                                                    setExpandedServers(p => ({ ...p, [server.id]: opening }))
                                                    if (opening) checkAllDomainsForServer(server)
                                                }}
                                                className="mt-1.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                            >
                                                {expandedServers[server.id]
                                                    ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                                    : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                            </button>
                                            <div className="p-2.5 bg-blue-500/10 rounded-xl flex-shrink-0 mt-0.5">
                                                <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-bold cursor-pointer select-none"
                                                        onClick={() => {
                                                            const opening = !expandedServers[server.id]
                                                            setExpandedServers(p => ({ ...p, [server.id]: opening }))
                                                            if (opening) checkAllDomainsForServer(server)
                                                        }}>
                                                        {server.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5">
                                                        {getStatusDot(server.status)}
                                                        <span className="text-xs text-muted-foreground">{getStatusLabel(server.status)}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[11px] h-5">{getServerTypeName(server.type)}</Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                                    {server.ipAddress && (
                                                        <span className="flex items-center gap-1">
                                                            <Network className="h-3 w-3" />{server.ipAddress}
                                                        </span>
                                                    )}
                                                    {server.providerRef && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />{server.providerRef.name}
                                                            {server.providerPlan && <span className="text-slate-400">({server.providerPlan.name})</span>}
                                                        </span>
                                                    )}
                                                    {server.size && (
                                                        <span className="flex items-center gap-1">
                                                            <Cpu className="h-3 w-3" />{server.size}
                                                        </span>
                                                    )}
                                                    {server.capacity != null && (
                                                        <span className="flex items-center gap-1">
                                                            <Layers className="h-3 w-3" />Cap. {server.capacity}%
                                                        </span>
                                                    )}
                                                </div>
                                                {(server.type === '1' || server.type === '2') && server.organization && (
                                                    <div className="flex items-center gap-1 mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                        <Building2 className="h-3 w-3" />
                                                        Cliente: {server.organization.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 ml-10 md:ml-0 flex-shrink-0">
                                            {/* Cost */}
                                            <div className="hidden sm:block text-right">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                                                    <DollarSign className="h-3 w-3" />
                                                    <span>{server.billingCycle === 'ANNUAL' ? 'Costo Anual' : 'Costo Mensual'}</span>
                                                </div>
                                                <p className="text-sm font-semibold">
                                                    {server.costMonthly > 0 || server.costAnnual > 0
                                                        ? `${server.currency || 'USD'} ${server.billingCycle === 'ANNUAL' 
                                                            ? Number(server.costAnnual || 0).toFixed(2) 
                                                            : Number(server.costMonthly || 0).toFixed(2)}`
                                                        : '—'}
                                                </p>
                                                {server.billingCycle === 'ANNUAL' && server.costMonthly > 0 && (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Equiv. {server.currency} {Number(server.costMonthly).toFixed(2)}/mes
                                                    </p>
                                                )}
                                            </div>
                                            {/* Next Payment */}
                                            <div className="hidden md:block text-right">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Próx. pago</span>
                                                </div>
                                                <p className={`text-sm font-semibold ${isExpiringSoon(server.nextPaymentDate) ? 'text-amber-500' : ''}`}>
                                                    {server.nextPaymentDate
                                                        ? new Date(server.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                                                        : '—'}
                                                </p>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex gap-1 border-l pl-4 border-slate-200 dark:border-slate-800">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500"
                                                    title="Añadir dominio"
                                                    onClick={() => openDomainDialog('create', server.id, server.name)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                {server.primaryDomain && (
                                                    <Button size="icon" variant="ghost"
                                                        className="h-8 w-8 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                                                        title="Diagnóstico del servidor"
                                                        onClick={() => runDiagnostics(server)}>
                                                        <Stethoscope className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500"
                                                    onClick={() => openServerDialog('edit', server)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                                                    onClick={() => handleDeleteServer(server.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domains Section */}
                                    {expandedServers[server.id] && (
                                        <div className="bg-slate-50/60 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 p-4 pl-16">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                    <Globe className="h-4 w-4 text-indigo-500" />
                                                    Dominios Vinculados
                                                    <Badge variant="secondary" className="h-5 text-[11px]">{server.domains?.length || 0}</Badge>
                                                </h4>
                                            </div>
                                            {(!server.domains || server.domains.length === 0) ? (
                                                <p className="text-xs text-slate-400 italic py-2">Sin dominios vinculados. Usa el botón + para añadir uno.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {server.domains.map(domain => (
                                                        <div key={domain.id}
                                                            className="group relative flex flex-col bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors overflow-hidden">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-semibold text-sm truncate pr-2" title={domain.domainName}>
                                                                    {domain.domainName}
                                                                </span>
                                                                {(() => {
                                                                    const h = domainHealth[domain.id]
                                                                    if (!h) return (
                                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                                            {getStatusDot(domain.status)}
                                                                            <span className="text-[11px] text-muted-foreground">{getStatusLabel(domain.status)}</span>
                                                                        </div>
                                                                    )
                                                                    if (h.status === 'checking') return (
                                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                                                            <span className="text-[11px] text-slate-400">Verificando...</span>
                                                                        </div>
                                                                    )
                                                                    if (h.status === 'up') return (
                                                                        <div className="flex items-center gap-1 flex-shrink-0" title={`HTTP \ - \ms`}>
                                                                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-500/30" />
                                                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Activo</span>
                                                                            <span className="text-[10px] text-slate-400">{h.latencyMs}ms</span>
                                                                        </div>
                                                                    )
                                                                    return (
                                                                        <div className="flex items-center gap-1 flex-shrink-0" title={h.errorMessage || 'Sin respuesta'}>
                                                                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                                            <span className="text-[11px] text-red-500 font-medium">Sin respuesta</span>
                                                                        </div>
                                                                    )
                                                                })()}
                                                            </div>
                                                            {domain.appName && (
                                                                <Badge variant="secondary" className="text-[10px] self-start mb-1.5 px-1.5 py-0 font-medium">
                                                                    <FolderOpen className="h-2.5 w-2.5 mr-1" />
                                                                    {domain.appName}
                                                                </Badge>
                                                            )}
                                                            <div className="text-xs text-slate-500 mb-1">
                                                                Vence: {' '}
                                                                <span className={isExpiringSoon(domain.expiresAt) ? 'text-amber-500 font-medium' : ''}>
                                                                    {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString('es-ES') : 'N/A'}
                                                                </span>
                                                            </div>
                                                            {domain.observations && (
                                                                <p className="text-[11px] text-slate-400 italic leading-snug">{domain.observations}</p>
                                                            )}
                                                            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-slate-800 flex items-center justify-end px-2 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {(domain.ftpAddress || domain.ftpUser || domain.hasFtpPassword) && (
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 shadow-sm bg-white dark:bg-slate-700 text-indigo-500"
                                                                        title="Ver credenciales FTP"
                                                                        onClick={() => openFtpSheet(domain)}>
                                                                        <Key className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 shadow-sm bg-white dark:bg-slate-700 text-slate-500"
                                                                    title="Verificar estado ahora"
                                                                    onClick={(e) => { e.stopPropagation(); checkDomainHealth(domain.id) }}>
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 shadow-sm bg-white dark:bg-slate-700"
                                                                    onClick={() => openDomainDialog('edit', server.id, server.name, domain)}>
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 shadow-sm bg-white dark:bg-slate-700 text-red-500"
                                                                    onClick={() => handleDeleteDomain(domain.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ══════════ PROVIDERS TAB ══════════ */}
                <TabsContent value="providers" className="pt-5">
                    <ProviderCatalog onUpdate={data => setProviders(data)} />
                </TabsContent>
            </Tabs>

            {/* ══════════ SERVER DIALOG ══════════ */}
            <Dialog open={serverDialog.open} onOpenChange={open => setServerDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                    <form onSubmit={handleSaveServer}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <HardDrive className="h-5 w-5 text-primary" />
                                {serverDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Servidor
                            </DialogTitle>
                            <DialogDescription>Configura todos los detalles técnicos, de facturación y relaciones del servidor.</DialogDescription>
                        </DialogHeader>

                        <div className="py-6 space-y-6">
                            {/* Section: Identificación */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <Server className="h-4 w-4 text-blue-500" /> Identificación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label>Nombre del Servidor *</Label>
                                        <Input value={sf.name} onChange={e => updateServerField('name', e.target.value)}
                                            required placeholder="Ej. VPS App Producción" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Tipo de Servidor *</Label>
                                        <Select value={sf.type} onValueChange={val => updateServerField('type', val)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SERVER_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Estado</Label>
                                        <Select value={sf.status} onValueChange={val => updateServerField('status', val)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SERVER_STATUS_OPTIONS.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Dirección IP</Label>
                                        <Input value={sf.ipAddress} onChange={e => updateServerField('ipAddress', e.target.value)}
                                            placeholder="192.168.x.x o IP pública" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1.5">
                                            <Globe2 className="h-3.5 w-3.5 text-violet-500" />
                                            Dominio Principal
                                        </Label>
                                        <Input value={sf.primaryDomain} onChange={e => updateServerField('primaryDomain', e.target.value)}
                                            placeholder="Ej. servidor.midominio.com" className="mt-1.5"
                                            title="Dominio único usado para monitorServer.php. Ej: servidor.midominio.com (sin https://)"
                                        />
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Debe ser único. Se usará para ejecutar el diagnóstico remoto del servidor.
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Tamaño / Descripción</Label>
                                        <Input value={sf.size} onChange={e => updateServerField('size', e.target.value)}
                                            placeholder="Ej. VPS-S, Dedicado-L" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Capacidad utilizada (%)</Label>
                                        <Input type="number" min="0" max="100" value={sf.capacity}
                                            onChange={e => updateServerField('capacity', e.target.value)}
                                            placeholder="0 – 100" className="mt-1.5" />
                                    </div>
                                    {showOrgSelect && (
                                        <div>
                                            <Label>Cliente / Organización *</Label>
                                            <Select value={sf.organizationId || 'none'} onValueChange={val => updateServerField('organizationId', val === 'none' ? '' : val)}>
                                                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione organización..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">– Sin asignar –</SelectItem>
                                                    {organizations.map(org => (
                                                        <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Section: Proveedor */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-indigo-500" /> Proveedor
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Proveedor de Hosting</Label>
                                        <Select value={sf.providerId}
                                            onValueChange={val => {
                                                updateServerField('providerId', val)
                                                updateServerField('providerPlanId', 'none')
                                            }}>
                                            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione proveedor..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">– Sin proveedor –</SelectItem>
                                                {providers.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Plan del Proveedor</Label>
                                        <Select value={sf.providerPlanId}
                                            onValueChange={val => updateServerField('providerPlanId', val)}
                                            disabled={sf.providerId === 'none' || !sf.providerId}>
                                            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione plan..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">– Sin plan –</SelectItem>
                                                {availablePlans.map(pl => (
                                                    <SelectItem key={pl.id} value={String(pl.id)}>
                                                        {pl.name} {pl.specs ? `(${pl.specs})` : ''} — {pl.currency} {pl.costMonthly}/mes | {pl.costAnnual}/año
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {availablePlans.length === 0 && sf.providerId !== 'none' && sf.providerId && (
                                            <p className="text-xs text-amber-500 mt-1">Este proveedor no tiene planes activos.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Section: Facturación */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-500" /> Facturación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Costo Mensual</Label>
                                        <div className="flex gap-2 mt-1.5">
                                            <Select value={sf.currency} onValueChange={val => updateServerField('currency', val)}>
                                                <SelectTrigger className="w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Input type="number" step="0.01" min="0" value={sf.costMonthly}
                                                onChange={e => updateServerField('costMonthly', e.target.value)}
                                                placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Costo Anual</Label>
                                        <Input type="number" step="0.01" min="0" value={sf.costAnnual}
                                            onChange={e => updateServerField('costAnnual', e.target.value)}
                                            placeholder="0.00" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Ciclo de Facturación</Label>
                                        <Select value={sf.billingCycle} onValueChange={val => updateServerField('billingCycle', val)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {BILLING_CYCLES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Próxima Fecha de Pago</Label>
                                        <Input type="date" value={sf.nextPaymentDate}
                                            onChange={e => updateServerField('nextPaymentDate', e.target.value)}
                                            className="mt-1.5" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Section: Notas */}
                            <div>
                                <Label>Observaciones y Notas</Label>
                                <Textarea value={sf.observations}
                                    onChange={e => updateServerField('observations', e.target.value)}
                                    placeholder="Credenciales de acceso (no sensibles), notas de mantenimiento, etc."
                                    className="mt-1.5 resize-none" rows={3} />
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-100 dark:border-slate-800 rounded-b-lg">
                            <Button type="button" variant="outline" onClick={() => setServerDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
                            <Button type="submit" className="min-w-[140px]">Guardar Servidor</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ══════════ DOMAIN DIALOG ══════════ */}
            <Dialog open={domainDialog.open} onOpenChange={open => setDomainDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Globe className="h-5 w-5 text-indigo-500" />
                            {domainDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Dominio
                        </DialogTitle>
                        <DialogDescription>
                            Servidor: <span className="font-semibold text-foreground">{domainDialog.serverName}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <form id="domain-form" onSubmit={handleSaveDomain}>
                        <Tabs defaultValue="general" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general" className="flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" /> General
                                </TabsTrigger>
                                <TabsTrigger value="ftp" className="flex items-center gap-1.5">
                                    <Key className="h-3.5 w-3.5" /> Accesos FTP
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5">
                                    <div className="md:col-span-2">
                                        <Label>Nombre de Dominio *</Label>
                                        <Input
                                            value={domainDialog.data.domainName}
                                            onChange={e => updateDomainField('domainName', e.target.value)}
                                            required placeholder="midominio.com" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Estado</Label>
                                        <Select value={domainDialog.data.status} onValueChange={val => updateDomainField('status', val)}>
                                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DOMAIN_STATUS_OPTIONS.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Fecha de Vencimiento</Label>
                                        <Input type="date"
                                            value={domainDialog.data.expiresAt}
                                            onChange={e => updateDomainField('expiresAt', e.target.value)}
                                            className="mt-1.5" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Observaciones</Label>
                                        <Textarea
                                            value={domainDialog.data.observations}
                                            onChange={e => updateDomainField('observations', e.target.value)}
                                            placeholder="DNS, registrar, renovación automática, notas..."
                                            className="mt-1.5 resize-none" rows={3} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="ftp">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5">
                                    <div className="md:col-span-2">
                                        <Label>Nombre APP</Label>
                                        <Input
                                            value={domainDialog.data.appName}
                                            onChange={e => updateDomainField('appName', e.target.value)}
                                            placeholder="Ej. WordPress, Laravel, PrestaShop..." className="mt-1.5" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Dirección FTP</Label>
                                        <Input
                                            value={domainDialog.data.ftpAddress}
                                            onChange={e => updateDomainField('ftpAddress', e.target.value)}
                                            placeholder="ftp.midominio.com" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Usuario FTP</Label>
                                        <Input
                                            value={domainDialog.data.ftpUser}
                                            onChange={e => updateDomainField('ftpUser', e.target.value)}
                                            placeholder="usuario@correo.com" className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Contraseña FTP</Label>
                                        <Input
                                            type="password"
                                            value={domainDialog.data.ftpPassword}
                                            onChange={e => updateDomainField('ftpPassword', e.target.value)}
                                            placeholder={domainDialog.data.hasFtpPassword ? '••••• (dejar vacío = no cambiar)' : 'Nueva contraseña'}
                                            className="mt-1.5" autoComplete="new-password" />
                                        {domainDialog.data.hasFtpPassword && (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> Contraseña cifrada guardada. Dejar vacío para no cambiarla.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>

                    <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-100 dark:border-slate-800 rounded-b-lg">
                        <Button type="button" variant="outline" onClick={() => setDomainDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
                        <Button type="submit" form="domain-form" className="min-w-[130px]">Guardar Dominio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════ FTP CREDENTIALS SHEET ══════════ */}
            <Sheet open={ftpSheet.open} onOpenChange={open => setFtpSheet(s => ({ ...s, open }))}>
                <SheetContent className="w-[380px] sm:w-[420px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-indigo-500" />
                            Credenciales FTP
                        </SheetTitle>
                        <SheetDescription>
                            {ftpSheet.domain?.domainName}
                            {ftpSheet.domain?.appName && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    <FolderOpen className="h-3 w-3" />{ftpSheet.domain.appName}
                                </span>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                        {/* FTP Address */}
                        {ftpSheet.domain?.ftpAddress && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Dirección FTP</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-mono truncate">
                                        {ftpSheet.domain.ftpAddress}
                                    </code>
                                    <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0"
                                        onClick={() => copyToClipboard('address', ftpSheet.domain?.ftpAddress)}>
                                        {ftpSheet.copied.address ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* FTP User */}
                        {ftpSheet.domain?.ftpUser && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Usuario FTP</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-mono truncate">
                                        {ftpSheet.domain.ftpUser}
                                    </code>
                                    <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0"
                                        onClick={() => copyToClipboard('user', ftpSheet.domain?.ftpUser)}>
                                        {ftpSheet.copied.user ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* FTP Password */}
                        {ftpSheet.domain?.hasFtpPassword && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Contraseña FTP</p>
                                {ftpSheet.password === null ? (
                                    <Button variant="outline" className="w-full" onClick={revealFtpPassword} disabled={ftpSheet.loading}>
                                        {ftpSheet.loading ? 'Descifrando...' : <><Eye className="h-4 w-4 mr-2" />Revelar contraseña</>}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-mono truncate">
                                            {ftpSheet.showPassword ? ftpSheet.password : '•'.repeat(Math.min(ftpSheet.password?.length || 8, 20))}
                                        </code>
                                        <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0"
                                            onClick={() => setFtpSheet(s => ({ ...s, showPassword: !s.showPassword }))}>
                                            {ftpSheet.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0"
                                            onClick={() => copyToClipboard('password', ftpSheet.password)}>
                                            {ftpSheet.copied.password ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!ftpSheet.domain?.ftpAddress && !ftpSheet.domain?.ftpUser && !ftpSheet.domain?.hasFtpPassword && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin credenciales FTP guardadas</p>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* ══════════ DIAGNOSTICS MODAL ══════════ */}
            <Dialog open={diagnosticsDialog.open} onOpenChange={open => setDiagnosticsDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Stethoscope className="h-5 w-5 text-violet-500" />
                            Diagnóstico — {diagnosticsDialog.serverName}
                        </DialogTitle>
                        <DialogDescription>
                            Resultados del monitorServer.php en tiempo real
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Loading */}
                        {diagnosticsDialog.loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                                <p className="text-sm text-muted-foreground">Ejecutando diagnóstico remoto...</p>
                                <p className="text-xs text-muted-foreground opacity-60">Puede tomar hasta 30 segundos</p>
                            </div>
                        )}

                        {/* Error */}
                        {!diagnosticsDialog.loading && diagnosticsDialog.error && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-full">
                                    <ShieldAlert className="h-8 w-8 text-red-500" />
                                </div>
                                <p className="font-semibold text-red-600 dark:text-red-400">No se pudo conectar al servidor</p>
                                <p className="text-sm text-muted-foreground text-center max-w-sm">{diagnosticsDialog.error}</p>
                                <Button variant="outline" onClick={() => {
                                    const server = servers.find(s => s.id === diagnosticsDialog.serverId)
                                    if (server) runDiagnostics(server)
                                }}>
                                    <RotateCcw className="h-4 w-4 mr-2" /> Reintentar
                                </Button>
                            </div>
                        )}

                        {/* Results */}
                        {!diagnosticsDialog.loading && diagnosticsDialog.data && (() => {
                            const d = diagnosticsDialog.data
                            const tests = d.tests || []
                            const passCount = tests.filter(t => t.status === 'ok').length
                            const warnCount = tests.filter(t => t.status === 'warning').length
                            const failCount = tests.filter(t => t.status === 'error').length
                            const overallOk = failCount === 0

                            return (
                                <div className="space-y-5">
                                    {/* Overall Banner */}
                                    <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                                        overallOk
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                                    }`}>
                                        <div className={`p-3 rounded-full ${overallOk ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                            {overallOk
                                                ? <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                                : <ShieldAlert className="h-6 w-6 text-red-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold text-base ${overallOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                                                {overallOk ? 'Servidor operando correctamente' : 'Se detectaron problemas en el servidor'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {passCount} OK · {warnCount} advertencias · {failCount} errores
                                                {d.generatedAt && ` · ${new Date(d.generatedAt).toLocaleTimeString('es-ES')}`}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => {
                                            const server = servers.find(s => s.id === diagnosticsDialog.serverId)
                                            if (server) runDiagnostics(server)
                                        }}>
                                            <RotateCcw className="h-3 w-3 mr-1.5" /> Actualizar
                                        </Button>
                                    </div>

                                    {/* Tests Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {tests.map((test, i) => {
                                            const isOk = test.status === 'ok'
                                            const isWarn = test.status === 'warning'
                                            const isErr = test.status === 'error'
                                            return (
                                                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                                                    isOk  ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                                    : isWarn ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                                                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                }`}>
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isOk  && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                        {isWarn && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                                        {isErr  && <XCircle className="h-4 w-4 text-red-500" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold leading-snug text-slate-700 dark:text-slate-200 truncate" title={test.name}>
                                                            {test.name}
                                                        </p>
                                                        {test.message && (
                                                            <p className={`text-[11px] mt-0.5 leading-snug ${
                                                                isErr ? 'text-red-600 dark:text-red-400'
                                                                : isWarn ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-muted-foreground'
                                                            }`}>
                                                                {test.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Raw info footer */}
                                    {d.serverInfo && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-2 border-t">
                                            {d.serverInfo.phpVersion && <span>PHP {d.serverInfo.phpVersion}</span>}
                                            {d.serverInfo.os && <span>{d.serverInfo.os}</span>}
                                            {d.serverInfo.hostname && <span>Host: {d.serverInfo.hostname}</span>}
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
