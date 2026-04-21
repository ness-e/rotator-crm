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
import { Progress } from '@/components/ui/progress'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import {
    Server, Globe, Plus, Edit, Trash2, Search, HardDrive,
    Network, Building2, ChevronDown, ChevronRight, DollarSign,
    Calendar, Activity, Layers, Cpu, AlertCircle,
    Key, Copy, Eye, EyeOff, Check, Lock, FolderOpen,
    Loader2, RotateCcw, XCircle, Wifi, Stethoscope,
    CheckCircle2, AlertTriangle, ShieldAlert, Info, Globe2,
    Clock, Database, Mail, Send, LayoutGrid, List, LayoutList,
    Filter, SlidersHorizontal
} from 'lucide-react'
import { SERVER_TYPES, getServerTypeName } from '@/constants/serverTypes'
import { ProviderCatalog } from '@/components/ProviderCatalog'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'

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
    const [viewMode, setViewMode] = useState('list') // 'list' | 'cards' | 'grouped'
    const [groupBy, setGroupBy] = useState('type')    // 'type' | 'status'
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const [filterProvider, setFilterProvider] = useState('all')
    const [serverDialog, setServerDialog] = useState({ open: false, mode: 'create', data: { ...emptyServer } })
    const [domainDialog, setDomainDialog] = useState({ open: false, mode: 'create', data: { ...emptyDomain }, serverId: null, serverName: '' })
    const [expandedServers, setExpandedServers] = useState({})
    const [ftpSheet, setFtpSheet] = useState({ open: false, domain: null, password: null, showPassword: false, loading: false, copied: {} })
    // domainHealth: { [domainId]: { status: 'checking'|'up'|'down', latencyMs, checkedAt, errorMessage } }
    const [serverHealth, setServerHealth] = useState({})
    const [domainHealth, setDomainHealth] = useState({})
    const [diagnosticsDialog, setDiagnosticsDialog] = useState({ open: false, serverId: null, serverName: '', loading: false, data: null, error: null })
    const [ajaxTesting, setAjaxTesting] = useState({ testing: false, result: null })
    const [mailTesting, setMailTesting] = useState({ testing: false, result: null, email: '' })
    const [serverDetailDialog, setServerDetailDialog] = useState({ open: false, server: null })


    useEffect(() => { loadData() }, [])

    const checkServerHealth = async (serverId) => {
        setServerHealth(h => ({ ...h, [serverId]: { status: 'checking' } }))
        try {
            const res = await api.get(`/servers/${serverId}/diagnostics`)
            if (res.ok) {
                const data = await res.json()
                // Server is considered "up" if ping and http (if applicable) are ok
                const isHealthy = data.results?.ping?.ok !== false && data.results?.http?.ok !== false
                setServerHealth(h => ({
                    ...h,
                    [serverId]: {
                        status: isHealthy ? 'up' : 'down',
                        error: isHealthy ? null : 'Fallo en pruebas diagnósticas',
                        checkedAt: new Date()
                    }
                }))
            } else {
                setServerHealth(h => ({ ...h, [serverId]: { status: 'down', error: 'Error de diagnóstico' } }))
            }
        } catch (e) {
            setServerHealth(h => ({ ...h, [serverId]: { status: 'down', error: 'Error de conexión' } }))
        }
    }

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
            if (serversRes.ok) {
                const sData = await serversRes.json()
                setServers(sData)
                // Auto-run health checks for all servers
                sData.forEach(s => checkServerHealth(s.id))
            }
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

    const handleAjaxTest = async () => {
        if (!diagnosticsDialog.serverId) return
        setAjaxTesting({ testing: true, result: null })
        try {
            const res = await api.get(`/servers/${diagnosticsDialog.serverId}/test-ajax`)
            const data = await res.json()
            setAjaxTesting({ testing: false, result: data })
            if (data.ok) {
                toast({ title: 'Prueba AJAX Exitosa', description: `Respuesta: ${data.response}` })
            } else {
                toast({ variant: 'destructive', title: 'Error en Prueba AJAX', description: data.error || 'El archivo no respondió correctamente' })
            }
        } catch (e) {
            setAjaxTesting({ testing: false, result: { ok: false, error: e.message } })
            toast({ variant: 'destructive', title: 'Error de Red', description: 'No se pudo contactar con el backend' })
        }
    }

    const handleMailTest = async () => {
        if (!diagnosticsDialog.serverId || !mailTesting.email) {
            if (!mailTesting.email) toast({ variant: 'destructive', title: 'Email requerido', description: 'Por favor ingresa un correo para la prueba' })
            return
        }
        setMailTesting(prev => ({ ...prev, testing: true, result: null }))
        try {
            const res = await api.post(`/servers/${diagnosticsDialog.serverId}/test-mail`, { email: mailTesting.email })
            const data = await res.json()
            setMailTesting(prev => ({ ...prev, testing: false, result: data }))
            if (data.ok) {
                toast({ title: 'Prueba de Email Enviada', description: data.response })
            } else {
                toast({ variant: 'destructive', title: 'Error en Envío de Email', description: data.error || data.response || 'El servidor no pudo enviar el correo' })
            }
        } catch (e) {
            setMailTesting(prev => ({ ...prev, testing: false, result: { ok: false, error: e.message } }))
            toast({ variant: 'destructive', title: 'Error de Red', description: 'No se pudo contactar con el backend' })
        }
    }

    const updateServerField = (field, value) =>
        setServerDialog(d => ({ ...d, data: { ...d.data, [field]: value } }))

    const runDiagnostics = async (server) => {
        setDiagnosticsDialog({ open: true, serverId: server.id, serverName: server.name, loading: true, data: null, error: null })
        setAjaxTesting({ testing: false, result: null }) // Reset ajax test state
        setMailTesting({ testing: false, result: null, email: '' }) // Reset mail test state
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

    const filteredServers = servers.filter(s => {
        const matchSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.ipAddress && s.ipAddress.includes(searchTerm)) ||
            (s.providerRef?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchStatus = filterStatus === 'all' || s.status === filterStatus
        const matchType   = filterType   === 'all' || String(s.type) === filterType
        const matchProv   = filterProvider === 'all' || String(s.providerId) === filterProvider
        return matchSearch && matchStatus && matchType && matchProv
    })

    // Derived state for provider/plan selects in server form
    const sf = serverDialog.data
    const selectedProvider = providers.find(p => String(p.id) === sf.providerId)
    const availablePlans = selectedProvider?.plans?.filter(p => p.isActive) || []
    const showOrgSelect = sf.type === '1' || sf.type === '2'

    // Stats
    const activeServers = servers.filter(s => s.status === 'active').length
    const totalDomains = servers.reduce((acc, s) => acc + (s.domains?.length || 0), 0)
    const expiringSoonPayments = servers.filter(s => isExpiringSoon(s.nextPaymentDate)).length

    // ── Helper: Logic for grouped view ──
    const getGroupedServers = () => {
        const groups = {}
        filteredServers.forEach(s => {
            let key = 'Otros'
            if (groupBy === 'type') {
                key = getServerTypeName(s.type)
            } else if (groupBy === 'status') {
                key = getStatusLabel(s.status)
            }

            if (!groups[key]) groups[key] = []
            groups[key].push(s)
        })
        return groups
    }

    // ── Helper Component: Server Detail Dialog ──
    const ServerDetailDialog = ({ open, onOpenChange, server }) => {
        if (!server) return null
        
        const domainsCount = server.domains?.length || 0
        const isExpiring = isExpiringSoon(server.nextPaymentDate)
        
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4 mb-4">
                        <div className="flex items-center justify-between pr-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <HardDrive className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-extrabold">{server.name}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{getServerTypeName(server.type)}</Badge>
                                        <span className="text-xs flex items-center gap-1">
                                            {getStatusDot(server.status)}
                                            {getStatusLabel(server.status)}
                                        </span>
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openServerDialog('edit', server)}>
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: General Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Conectividad</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Network className="h-3.5 w-3.5" /> IP Pública</span>
                                            <span className="text-sm font-mono font-medium">{server.ipAddress || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> Dominio Principal</span>
                                            <span className="text-sm font-medium truncate max-w-[150px]">{server.primaryDomain || '—'}</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Infraestructura</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Proveedor</span>
                                            <span className="text-sm font-medium">{server.providerRef?.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> Especificaciones</span>
                                            <span className="text-sm font-medium">{server.size || 'No definido'}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Domains Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-indigo-500" />
                                        Dominios Vinculados ({domainsCount})
                                    </h4>
                                    <Button size="xs" variant="ghost" className="h-7 text-[11px] text-indigo-600" onClick={() => openDomainDialog('create', server.id, server.name)}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                </div>
                                
                                {server.domains?.length > 0 ? (
                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b">
                                                <tr>
                                                    <th className="text-left py-2 px-4 font-semibold text-[11px] uppercase">Dominio</th>
                                                    <th className="text-left py-2 px-4 font-semibold text-[11px] uppercase">Estado</th>
                                                    <th className="text-right py-2 px-4 font-semibold text-[11px] uppercase">Vencimiento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {server.domains.map(d => (
                                                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium">{d.domainName}</td>
                                                        <td className="py-2.5 px-4">
                                                            <div className="flex items-center gap-1.5">
                                                                {getStatusDot(d.status)}
                                                                <span className="text-xs text-muted-foreground">{getStatusLabel(d.status)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-xs">
                                                            {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                                        <Globe className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs">No hay dominios vinculados a este servidor</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Billing & Actions */}
                        <div className="space-y-6">
                            <Card className="p-4 border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    Facturación
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Costo ({server.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensual'})</span>
                                        <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                            {server.currency || 'USD'} {Number(server.billingCycle === 'ANNUAL' ? server.costAnnual : server.costMonthly).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Próximo Pago</span>
                                        <p className={`text-sm font-bold flex items-center gap-2 ${isExpiring ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                            <Calendar className="h-4 w-4" />
                                            {server.nextPaymentDate ? new Date(server.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No definida'}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Ciclo</span>
                                        <Badge variant="secondary" className="text-[10px] uppercase">{server.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensual'}</Badge>
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Acciones Rápidas</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-10 border-slate-200" onClick={() => runDiagnostics(server)}>
                                        <Stethoscope className="h-4 w-4 text-violet-500" /> Diagnóstico de Salud
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-3 h-10 border-slate-200" onClick={() => openDomainDialog('create', server.id, server.name)}>
                                        <Plus className="h-4 w-4 text-emerald-500" /> Añadir Dominio
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-3 h-10 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20" 
                                        onClick={() => {
                                            onOpenChange(false)
                                            handleDeleteServer(server.id)
                                        }}>
                                        <Trash2 className="h-4 w-4" /> Eliminar Servidor
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // ── Helper Component: Server Card ──
    const ServerCard = ({ server }) => {
        const domainsCount = server.domains?.length || 0
        const isExpiring = isExpiringSoon(server.nextPaymentDate)
        const health = serverHealth[server.id]
        const isFailed = health?.status === 'down'
        const isChecking = health?.status === 'checking'
        
        return (
            <Card className={`flex flex-col h-full rounded-2xl border transition-all duration-500 group overflow-hidden relative ${
                isFailed 
                    ? 'border-red-500 shadow-red-100 dark:shadow-red-950/20 shadow-lg ring-1 ring-red-500/20' 
                    : 'border-slate-200/60 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:-translate-y-1'
            } bg-white dark:bg-slate-900`}>
                
                {/* Health Status Overlay for Errors */}
                {isFailed && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 z-10 animate-pulse" />
                )}

                {/* Card Header */}
                <div className={`p-4 border-b flex justify-between items-start ${
                    isFailed 
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' 
                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100/50 dark:border-slate-800/50'
                }`}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {isChecking ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
                            ) : (
                                getStatusDot(server.status)
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80">
                                {isChecking ? 'Verificando...' : getStatusLabel(server.status)}
                            </span>
                            {isFailed && (
                                <Badge variant="destructive" className="h-4 text-[8px] px-1 font-black animate-pulse">
                                    <AlertTriangle className="h-2 w-2 mr-0.5" /> ERROR
                                </Badge>
                            )}
                        </div>
                        <h3 className={`text-base font-bold line-clamp-1 ${isFailed ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {server.name}
                        </h3>
                    </div>
                    <Badge variant={isFailed ? "destructive" : "secondary"} className="text-[10px] font-bold h-5">
                        {getServerTypeName(server.type)}
                    </Badge>
                </div>

                <CardContent className="p-5 flex-grow space-y-5">
                    {/* Technical Specs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Dirección IP</p>
                            <p className="text-sm font-mono font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <Network className="h-3.5 w-3.5 text-blue-500/80" />
                                {server.ipAddress || '—'}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Proveedor</p>
                            <p className="text-sm font-medium flex items-center gap-1.5 justify-end text-slate-700 dark:text-slate-300">
                                <Building2 className="h-3.5 w-3.5 text-indigo-500/80" />
                                {server.providerRef?.name || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Hardware info without capacity */}
                    <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Especificaciones</p>
                            <p className="text-sm font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <Cpu className="h-3.5 w-3.5 text-orange-500/80" />
                                {server.size || 'No definido'}
                            </p>
                        </div>
                    </div>

                    {/* Domains & Billing */}
                    <div className="pt-2 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Dominios</p>
                            <div className="flex items-center gap-1.5">
                                <Globe2 className="h-3.5 w-3.5 text-blue-500/80" />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{domainsCount} vinculados</span>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Vencimiento</p>
                            <p className={`text-sm font-bold flex items-center gap-1.5 justify-end ${isExpiring ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                <Clock className="h-3.5 w-3.5" />
                                {server.nextPaymentDate ? new Date(server.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Client Info */}
                    {(server.type === '1' || server.type === '2') && server.organization && (
                        <div className="mt-2 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-2">
                            <div className="p-1 bg-indigo-500/10 rounded-md">
                                <Building2 className="h-3 w-3 text-indigo-600" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-700/80 dark:text-indigo-300/80 truncate">
                                {server.organization.name}
                            </span>
                        </div>
                    )}
                </CardContent>

                <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" onClick={() => openServerDialog('edit', server)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" onClick={() => handleDeleteServer(server.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-xl border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        onClick={() => setServerDetailDialog({ open: true, server })}>
                        Ver Detalles
                    </Button>
                </div>
            </Card>
        )
    }

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

                    {/* ── Toolbar: Vista + Filtros ── */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* View switcher */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    {[
                                        { mode: 'cards',   Icon: LayoutGrid,  label: 'Tarjetas' },
                                        { mode: 'grouped', Icon: LayoutList,   label: 'Agrupada' },
                                        { mode: 'list',    Icon: List,         label: 'Lista'    },
                                    ].map(({ mode, Icon, label }) => (
                                        <button key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                                viewMode === mode
                                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}>
                                            <Icon className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </div>

                                {viewMode === 'grouped' && (
                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Agrupar por:</span>
                                        {[{ key: 'type', label: 'Tipo' }, { key: 'status', label: 'Estado' }].map(({ key, label }) => (
                                            <button key={key}
                                                onClick={() => setGroupBy(key)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                    groupBy === key
                                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}>{label}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button className="rounded-xl shadow-md h-10 px-6 font-bold flex-shrink-0 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                                onClick={() => openServerDialog('create')}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Servidor
                            </Button>
                        </div>

                        <Separator className="bg-slate-100 dark:bg-slate-800" />

                        {/* Filters row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Filtros</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status filter */}
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary/20">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {SERVER_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Type filter */}
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary/20">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        {SERVER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Provider filter */}
                                {providers.length > 0 && (
                                    <Select value={filterProvider} onValueChange={setFilterProvider}>
                                        <SelectTrigger className="h-9 w-auto min-w-[150px] text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary/20">
                                            <SelectValue placeholder="Proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los proveedores</SelectItem>
                                            {providers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Active filter pills */}
                            {(filterStatus !== 'all' || filterType !== 'all' || filterProvider !== 'all') && (
                                <button onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterProvider('all') }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50 hover:bg-red-100 transition-all">
                                    <XCircle className="h-3.5 w-3.5" /> Limpiar
                                </button>
                            )}

                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Mostrando:</span>
                                <Badge variant="secondary" className="rounded-lg font-mono">{filteredServers.length}</Badge>
                            </div>
                        </div>
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
                        <div className="mt-4">
                            {/* ── MODE: CARDS ── */}
                            {viewMode === 'cards' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredServers.map(server => (
                                        <ServerCard key={server.id} server={server} />
                                    ))}
                                </div>
                            )}

                            {/* ── MODE: GROUPED ── */}
                            {viewMode === 'grouped' && (
                                <div className="space-y-10">
                                    {Object.entries(getGroupedServers()).map(([groupName, groupServers]) => (
                                        <div key={groupName} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800" />
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                                                    {groupBy === 'type' ? <Layers className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                                                    {groupName}
                                                    <span className="ml-1 text-slate-300 font-normal">({groupServers.length})</span>
                                                </h3>
                                                <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {groupServers.map(server => (
                                                    <ServerCard key={server.id} server={server} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── MODE: LIST ── */}
                            {viewMode === 'list' && (
                                <div className="space-y-4">
                                    {filteredServers.map(server => {
                                        const health = serverHealth[server.id];
                                        const isFailed = health?.status === 'down';
                                        const isChecking = health?.status === 'checking';
                                        
                                        return (
                                            <Card key={server.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden hover:shadow-md ${
                                                isFailed 
                                                    ? 'border-red-500 bg-red-50/10 dark:bg-red-950/5 shadow-sm shadow-red-100' 
                                                    : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm'
                                            }`}>
                                                {/* Server Row */}
                                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <button
                                                            onClick={() => {
                                                                const opening = !expandedServers[server.id];
                                                                setExpandedServers(p => ({ ...p, [server.id]: opening }));
                                                                if (opening) checkAllDomainsForServer(server);
                                                            }}
                                                            className="mt-1.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                        >
                                                            {expandedServers[server.id]
                                                                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                        </button>
                                                        <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${isFailed ? 'bg-red-500/15' : 'bg-blue-500/10'}`}>
                                                            {isChecking ? (
                                                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                                            ) : isFailed ? (
                                                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                            ) : (
                                                                <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className={`text-base font-bold cursor-pointer select-none ${isFailed ? 'text-red-700 dark:text-red-400' : ''}`}
                                                                    onClick={() => {
                                                                        const opening = !expandedServers[server.id];
                                                                        setExpandedServers(p => ({ ...p, [server.id]: opening }));
                                                                        if (opening) checkAllDomainsForServer(server);
                                                                    }}>
                                                                    {server.name}
                                                                </h3>
                                                                <div className="flex items-center gap-1.5">
                                                                    {getStatusDot(server.status)}
                                                                    <span className="text-xs text-muted-foreground">{getStatusLabel(server.status)}</span>
                                                                </div>
                                                                <Badge variant="outline" className="text-[11px] h-5">{getServerTypeName(server.type)}</Badge>
                                                                {isFailed && (
                                                                    <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">
                                                                        ERROR EN TESTS
                                                                    </Badge>
                                                                )}
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
                                                        </div>
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
                                                        <div className="flex items-center gap-1 border-l pl-4 border-slate-200 dark:border-slate-800">
                                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => setServerDetailDialog({ open: true, server })}>
                                                                Ver Detalles
                                                            </Button>
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
                                                                                const h = domainHealth[domain.id];
                                                                                if (!h) return (
                                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                                        {getStatusDot(domain.status)}
                                                                                        <span className="text-[11px] text-muted-foreground">{getStatusLabel(domain.status)}</span>
                                                                                    </div>
                                                                                );
                                                                                if (h.status === 'checking') return (
                                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                                        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                                                                        <span className="text-[11px] text-slate-400">Verificando...</span>
                                                                                    </div>
                                                                                );
                                                                                if (h.status === 'up') return (
                                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-500/30" />
                                                                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Activo</span>
                                                                                        <span className="text-[10px] text-slate-400">{h.latencyMs}ms</span>
                                                                                    </div>
                                                                                );
                                                                                return (
                                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                                                        <span className="text-[11px] text-red-500 font-medium">Sin respuesta</span>
                                                                                    </div>
                                                                                );
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
                                        );
                                    })}
                                </div>
                            )}
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
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Label>Nombre del Servidor *</Label>
                                        </div>
                                        <Input value={sf.name} onChange={e => updateServerField('name', e.target.value)}
                                            required placeholder="Ej. VPS App Producción" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Label>Tipo de Servidor *</Label>
                                            <InfoHint content={SYSTEM_HINTS.SERVER_TYPE} />
                                        </div>
                                        <Select value={sf.type} onValueChange={val => updateServerField('type', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SERVER_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Label>Estado</Label>
                                            <InfoHint content={SYSTEM_HINTS.SERVER_STATUS} />
                                        </div>
                                        <Select value={sf.status} onValueChange={val => updateServerField('status', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SERVER_STATUS_OPTIONS.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Label>Dirección IP</Label>
                                            <InfoHint content={SYSTEM_HINTS.SERVER_IP} />
                                        </div>
                                        <Input value={sf.ipAddress} onChange={e => updateServerField('ipAddress', e.target.value)}
                                            placeholder="192.168.x.x o IP pública" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Label className="flex items-center gap-1.5">
                                                <Globe2 className="h-3.5 w-3.5 text-violet-500" />
                                                Dominio Principal
                                            </Label>
                                            <InfoHint content={SYSTEM_HINTS.SERVER_PRIMARY_DOMAIN} />
                                        </div>
                                        <Input value={sf.primaryDomain} onChange={e => updateServerField('primaryDomain', e.target.value)}
                                            placeholder="Ej. servidor.midominio.com"
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
                            const rawTests = d.tests || []
                            
                            // Define which tests should be expanded to 3 columns
                            const expandedKeys = [
                                'virus_detection', 
                                'studies', 
                                'fs_2hours_intensity', 
                                'ajax_supported',
                                'disk_usage',
                                'php_version',
                                'php_common_functions',
                                'js_common_functions',
                                'post_100mb_support',
                                'email_test'
                            ]

                            // Sort tests: expanded ones first
                            const tests = [...rawTests].sort((a, b) => {
                                const isExpA = expandedKeys.includes(a.key) || (a.key === 'virus_detection' && a.status !== 'ok')
                                const isExpB = expandedKeys.includes(b.key) || (b.key === 'virus_detection' && b.status !== 'ok')
                                if (isExpA && !isExpB) return -1
                                if (!isExpA && isExpB) return 1
                                return 0
                            })

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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {tests.map((test, i) => {
                                            const isOk = test.status === 'ok'
                                            const isWarn = test.status === 'warning'
                                            const isErr = test.status === 'error'
                                            const isVirusWarning = test.key === 'virus_detection' && !isOk
                                            const isStudies = test.key === 'studies'
                                            const isIntensity = test.key === 'fs_2hours_intensity'
                                            const isAjax = test.key === 'ajax_supported'
                                            const isDisk = test.key === 'disk_usage'
                                            const isPhpVer = test.key === 'php_version'
                                            const isPhpFunc = test.key === 'php_common_functions'
                                            const isJsFunc = test.key === 'js_common_functions'
                                            const isPostMax = test.key === 'post_100mb_support'
                                            const isMailTest = test.key === 'email_test'

                                            const expandTo3Cols = expandedKeys.includes(test.key) || isVirusWarning
                                            
                                            return (
                                                <div key={i} className={`flex flex-col p-4 rounded-xl border transition-all ${
                                                    expandTo3Cols ? 'col-span-1 sm:col-span-2 lg:col-span-3' : ''
                                                } ${
                                                    isOk  ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm'
                                                    : isWarn ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 shadow-sm'
                                                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-md'
                                                }`}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="flex-shrink-0 mt-1">
                                                                {isOk  && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                                                {isWarn && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                                                {isErr  && <XCircle className="h-5 w-5 text-red-500" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                                                    {test.name}
                                                                </p>
                                                                {(!expandTo3Cols || isVirusWarning) && test.message && (
                                                                    <p className={`text-[11px] mt-1 leading-snug font-medium ${
                                                                        isErr ? 'text-red-600 dark:text-red-400'
                                                                        : isWarn ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-muted-foreground'
                                                                    }`}>
                                                                        {test.message}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                                            isOk ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                            : isWarn ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                        }`}>
                                                            {test.status}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Virus Detection Detailed Render */}
                                                    {isVirusWarning && test.raw?.detailsHtml && (
                                                        <div 
                                                            className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-800/60 text-sm overflow-auto max-h-[500px] bg-white/40 dark:bg-black/20 p-4 rounded-md font-mono [&_ul]:list-[circle] [&_ul]:ml-5 [&_li]:mt-1 [&_ul>li>ul]:list-[square]"
                                                            dangerouslySetInnerHTML={{ __html: test.raw.detailsHtml }}
                                                        />
                                                    )}
                                                    
                                                    {/* Studies Custom Render */}
                                                    {isStudies && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-inner">
                                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2">Total Estudios</p>
                                                                <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{test.raw.total}</p>
                                                            </div>
                                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 text-center shadow-inner">
                                                                <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-black uppercase tracking-widest mb-2">Móvil / Tablet</p>
                                                                <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{test.raw.mobile}</p>
                                                            </div>
                                                            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 text-center shadow-inner relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                    <Activity className="h-12 w-12 text-emerald-600" />
                                                                </div>
                                                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-black uppercase tracking-widest mb-2">Activos Hoy</p>
                                                                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{test.raw.activeToday}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Intensity Custom Render */}
                                                    {isIntensity && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                            <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/30 flex items-center justify-between shadow-sm">
                                                                <div>
                                                                    <p className="text-[10px] text-orange-600/70 font-black uppercase mb-1">Archivos Modificados</p>
                                                                    <p className="text-sm text-muted-foreground font-medium italic mb-2">Últimas 2 horas</p>
                                                                    <p className="text-5xl font-black text-orange-600 dark:text-orange-400">{test.raw.filesModified}</p>
                                                                </div>
                                                                <div className="p-4 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                                                                    <Clock className="h-10 w-10 text-orange-600" />
                                                                </div>
                                                            </div>
                                                            <div className="bg-blue-50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/30 flex items-center justify-between shadow-sm">
                                                                <div>
                                                                    <p className="text-[10px] text-blue-600/70 font-black uppercase mb-3">Volumen de Transferencia</p>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-5xl font-black text-blue-600 dark:text-blue-400">{test.raw.bytesMB}</p>
                                                                        <p className="text-xl font-black text-blue-500/60 uppercase">MB</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                                                    <Database className="h-10 w-10 text-blue-600" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Disk Usage Render */}
                                                    {isDisk && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="flex justify-between items-end mb-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                        <HardDrive className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Espacio Utilizado</p>
                                                                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                                                            {test.raw.usedGB} <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">GB</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right pb-1">
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Capacidad Total</p>
                                                                    <p className="text-lg font-black text-slate-500">{test.raw.limitGB} GB</p>
                                                                </div>
                                                            </div>
                                                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                                        (test.raw.usedGB / test.raw.limitGB) > 0.9 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)]' 
                                                                        : (test.raw.usedGB / test.raw.limitGB) > 0.7 ? 'bg-gradient-to-r from-amber-500 to-amber-300' 
                                                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                                    }`}
                                                                    style={{ width: `${Math.min(100, (test.raw.usedGB / test.raw.limitGB) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-3 text-right font-black tracking-widest uppercase italic">
                                                                {Math.round((test.raw.usedGB / test.raw.limitGB) * 100)}% de Cuota de Disco en Uso
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* PHP Version Render */}
                                                    {isPhpVer && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                            <div className="flex items-center gap-5">
                                                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                                                                    <Cpu className="h-10 w-10 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded uppercase">Entorno PHP</span>
                                                                    </div>
                                                                    <p className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">v{test.raw.version}</p>
                                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Versión Actual del Servidor</p>
                                                                </div>
                                                            </div>
                                                            <div className="px-6 py-4 bg-slate-900 dark:bg-white rounded-2xl text-center min-w-[140px]">
                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Requisito Mínimo</p>
                                                                <p className="text-xl font-black text-white dark:text-slate-900">v{test.raw.minimum}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* PHP/JS Common Functions Render */}
                                                    {(isPhpFunc || isJsFunc) && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6">
                                                            <div className="relative group">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                                                <div className="relative flex-shrink-0 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl min-w-[100px] text-center">
                                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">Compilación</p>
                                                                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{test.raw.version}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-2">Librerías de Funciones Nucleares</p>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                                    {isPhpFunc 
                                                                        ? 'Funciones maestras de servidor optimizadas y sincronizadas para el procesamiento de encuestas de alto volumen.' 
                                                                        : 'Scripts de utilidad cliente cargados y validados correctamente en el entorno de ejecución del navegador.'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* POST Max Size Render */}
                                                    {isPostMax && test.raw && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="flex items-center gap-4 p-5 bg-violet-600 rounded-3xl shadow-lg shadow-violet-100 dark:shadow-none text-white overflow-hidden relative group">
                                                                <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                                                                    <Layers className="h-24 w-24" />
                                                                </div>
                                                                <div className="relative">
                                                                    <p className="text-[10px] text-violet-200 font-black uppercase tracking-widest mb-1">POST Max Size</p>
                                                                    <p className="text-4xl font-black">{test.raw.post_max_size}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 p-5 bg-fuchsia-600 rounded-3xl shadow-lg shadow-fuchsia-100 dark:shadow-none text-white overflow-hidden relative group">
                                                                <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                                                                    <Plus className="h-24 w-24" />
                                                                </div>
                                                                <div className="relative">
                                                                    <p className="text-[10px] text-fuchsia-200 font-black uppercase tracking-widest mb-1">Upload Max Size</p>
                                                                    <p className="text-4xl font-black">{test.raw.upload_max_filesize}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* AJAX Supported Render with Test Button */}
                                                    {isAjax && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 gap-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`p-4 rounded-2xl shadow-sm ${test.raw?.fileExists ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                                                                        <Activity className={`h-8 w-8 ${test.raw?.fileExists ? 'text-emerald-600' : 'text-red-600'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">ajaxCheck.php</p>
                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                            {test.raw?.fileExists 
                                                                                ? 'Endpoint de validación detectado en el servidor remoto.' 
                                                                                : 'El archivo de prueba no ha sido localizado en la ruta pública.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-center sm:items-end gap-3 min-w-[200px]">
                                                                    <Button 
                                                                        size="lg" 
                                                                        disabled={ajaxTesting.testing || !test.raw?.fileExists}
                                                                        onClick={handleAjaxTest}
                                                                        className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:scale-105 transition-transform font-black uppercase tracking-widest text-[10px] h-12 px-8"
                                                                    >
                                                                        {ajaxTesting.testing ? (
                                                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</>
                                                                        ) : (
                                                                            <><Wifi className="h-4 w-4 mr-2" /> Ejecutar Test AJAX</>
                                                                        )}
                                                                    </Button>
                                                                    {ajaxTesting.result && (
                                                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                                            ajaxTesting.result.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                                        }`}>
                                                                            {ajaxTesting.result.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                                            {ajaxTesting.result.ok ? 'Respuesta Correcta' : 'Fallo de Comunicación'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Email Test Interactive Render */}
                                                    {isMailTest && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="flex flex-col lg:flex-row items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 gap-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`p-4 rounded-2xl shadow-sm ${test.raw?.fileExists ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                                                                        <Mail className={`h-8 w-8 ${test.raw?.fileExists ? 'text-amber-600' : 'text-red-600'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">ajaxMailtest.php</p>
                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                            {test.raw?.fileExists 
                                                                                ? 'Prueba de envío de correos vía AJAX disponible.' 
                                                                                : 'El archivo de prueba de correo no fue encontrado.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                
                                                                {test.raw?.fileExists && (
                                                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                                                        <div className="relative w-full sm:w-64">
                                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                            <Input 
                                                                                placeholder="tu@email.com" 
                                                                                value={mailTesting.email}
                                                                                onChange={(e) => setMailTesting(prev => ({ ...prev, email: e.target.value }))}
                                                                                className="pl-10 h-12 rounded-xl bg-white dark:bg-slate-900"
                                                                            />
                                                                        </div>
                                                                        <Button 
                                                                            size="lg" 
                                                                            disabled={mailTesting.testing || !mailTesting.email}
                                                                            onClick={handleMailTest}
                                                                            className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:scale-105 transition-transform font-black uppercase tracking-widest text-[10px] h-12 px-8"
                                                                        >
                                                                            {mailTesting.testing ? (
                                                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                                                                            ) : (
                                                                                <><Send className="h-4 w-4 mr-2" /> Enviar Prueba</>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {mailTesting.result && (
                                                                <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-xl border ${
                                                                    mailTesting.result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                                                }`}>
                                                                    {mailTesting.result.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                                                    <p className="text-xs font-bold">{mailTesting.result.response || mailTesting.result.error}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Raw info footer */}
                                    {d.serverInfo && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-4 border-t">
                                            {d.serverInfo.phpVersion && <span className="font-medium">PHP {d.serverInfo.phpVersion}</span>}
                                            {d.serverInfo.os && <span>· {d.serverInfo.os}</span>}
                                            {d.serverInfo.hostname && <span>· Host: {d.serverInfo.hostname}</span>}
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
            <ServerDetailDialog 
                open={serverDetailDialog.open} 
                onOpenChange={(open) => setServerDetailDialog(p => ({ ...p, open }))} 
                server={serverDetailDialog.server} 
            />
        </div>
    )
}
