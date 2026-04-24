import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/utils/api'
import {
    Building2,
    Plus,
    Edit,
    Trash2,
    ExternalLink,
    Server,
    Cpu,
    CheckCircle2,
    XCircle,
    Globe,
    Package,
} from 'lucide-react'

export function ProviderCatalog({ onUpdate }) {
    const { toast } = useToast()
    const [providers, setProviders] = useState([])
    const [loading, setLoading] = useState(true)
    const [providerDialog, setProviderDialog] = useState({ open: false, mode: 'create', data: null })
    const [planDialog, setPlanDialog] = useState({ open: false, mode: 'create', data: null, providerId: null, providerName: '' })
    const [providerForm, setProviderForm] = useState({ name: '', website: '', notes: '', isActive: true })
    const [planForm, setPlanForm] = useState({ name: '', specs: '', isActive: true, costMonthly: 0, costAnnual: 0, currency: 'USD' })

    useEffect(() => { loadProviders() }, [])

    const resetProviderForm = (data = null) => {
        setProviderForm({
            name: data?.name || '',
            website: data?.website || '',
            notes: data?.notes || '',
            isActive: data?.isActive !== undefined ? data.isActive : true,
        })
    }

    const resetPlanForm = (data = null) => {
        setPlanForm({
            name: data?.name || '',
            specs: data?.specs || '',
            isActive: data?.isActive !== undefined ? data.isActive : true,
            costMonthly: data?.costMonthly || 0,
            costAnnual: data?.costAnnual || 0,
            currency: data?.currency || 'USD',
        })
    }

    const loadProviders = async () => {
        setLoading(true)
        try {
            const res = await api.get('/providers')
            if (res.ok) {
                const data = await res.json()
                setProviders(data)
                if (onUpdate) onUpdate(data)
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los proveedores', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const openProviderDialog = (mode, data = null) => {
        resetProviderForm(data)
        setProviderDialog({ open: true, mode, data })
    }

    const openPlanDialog = (mode, providerId, providerName, data = null) => {
        resetPlanForm(data)
        setPlanDialog({ open: true, mode, data, providerId, providerName })
    }

    const handleSaveProvider = async (e) => {
        e.preventDefault()
        try {
            const res = providerDialog.mode === 'create'
                ? await api.post('/providers', providerForm)
                : await api.put(`/providers/${providerDialog.data.id}`, providerForm)

            if (res.ok) {
                toast({ title: 'Éxito', description: `Proveedor ${providerDialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setProviderDialog({ open: false, mode: 'create', data: null })
                loadProviders()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al guardar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleDeleteProvider = async (id) => {
        if (!confirm('¿Eliminar este proveedor? Los servidores asociados perderán esta referencia.')) return
        try {
            const res = await api.delete(`/providers/${id}`)
            if (res.ok) {
                toast({ title: 'Proveedor desactivado correctamente' })
                loadProviders()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al eliminar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleSavePlan = async (e) => {
        e.preventDefault()
        try {
            const isCreate = planDialog.mode === 'create'
            const url = isCreate
                ? `/providers/${planDialog.providerId}/plans`
                : `/providers/plans/${planDialog.data.id}`
            const res = isCreate
                ? await api.post(url, planForm)
                : await api.put(url, planForm)

            if (res.ok) {
                toast({ title: 'Éxito', description: `Plan ${isCreate ? 'creado' : 'actualizado'}` })
                setPlanDialog({ open: false, mode: 'create', data: null, providerId: null, providerName: '' })
                loadProviders()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al guardar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const handleDeletePlan = async (providerId, planId) => {
        if (!confirm('¿Eliminar este plan de servidor?')) return
        try {
            const res = await api.delete(`/providers/plans/${planId}`)
            if (res.ok) {
                toast({ title: 'Plan desactivado correctamente' })
                loadProviders()
            } else {
                const err = await res.json()
                throw new Error(err.error || 'Error al eliminar')
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const totalPlans = providers.reduce((acc, p) => acc + (p.plans?.length || 0), 0)
    const activeProviders = providers.filter(p => p.isActive).length

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/15 rounded-lg">
                        <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{providers.length}</p>
                        <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Proveedores</p>
                    </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/15 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeProviders}</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Activos</p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/15 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalPlans}</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Planes totales</p>
                    </div>
                </div>
            </div>

            {/* Header + Action */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Catálogo de Proveedores</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Empresas de hosting y sus planes de servidor disponibles.</p>
                </div>
                <Button className="rounded-xl shadow-sm" onClick={() => openProviderDialog('create')}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
                </Button>
            </div>

            {providers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Building2 className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No hay proveedores registrados</p>
                    <p className="text-sm text-slate-400 mt-1">Añade tu primer proveedor de hosting</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {providers.map(provider => (
                        <Card key={provider.id} className={`flex flex-col rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${!provider.isActive ? 'opacity-60 border-dashed' : 'border-slate-200/80 dark:border-slate-800/80'}`}>
                            {/* Card Header */}
                            <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/0">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold leading-tight">{provider.name}</CardTitle>
                                            <Badge variant={provider.isActive ? 'default' : 'secondary'} className="text-[10px] mt-1 h-4">
                                                {provider.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0 ml-2">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => openProviderDialog('edit', provider)}>
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDeleteProvider(provider.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Website */}
                                {provider.website && (
                                    <a href={provider.website} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline mt-2 ml-0.5">
                                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{provider.website.replace('https://', '').replace('http://', '')}</span>
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                )}
                            </CardHeader>

                            <CardContent className="flex-grow flex flex-col pt-4 gap-4">
                                {/* Notes */}
                                {provider.notes && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                                        {provider.notes}
                                    </p>
                                )}

                                {/* Servers Count */}
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Server className="h-3.5 w-3.5" />
                                    <span>{provider.servers?.length ?? 0} servidor(es) usando este proveedor</span>
                                </div>

                                <Separator />

                                {/* Plans Section */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5" />
                                            Planes ({provider.plans?.length || 0})
                                        </h4>
                                        <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 rounded-lg"
                                            onClick={() => openPlanDialog('create', provider.id, provider.name)}>
                                            <Plus className="h-3 w-3 mr-1" /> Plan
                                        </Button>
                                    </div>

                                    {(!provider.plans || provider.plans.length === 0) ? (
                                        <p className="text-xs text-slate-400 italic py-2 text-center">Sin planes configurados</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {provider.plans.map(plan => (
                                                <div key={plan.id}
                                                    className={`group flex items-start justify-between p-2.5 rounded-lg border transition-colors ${plan.isActive ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800' : 'bg-slate-50/30 dark:bg-slate-900/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <Cpu className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                                                            <p className="text-sm font-semibold truncate">{plan.name}</p>
                                                            {!plan.isActive && <Badge variant="outline" className="text-[9px] h-3.5 px-1">Inactivo</Badge>}
                                                        </div>
                                                        {plan.specs && (
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug pl-4.5">{plan.specs}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-1 pl-4.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                <span>{plan.currency} {Number(plan.costMonthly).toLocaleString()}</span>
                                                                <span className="text-[9px] opacity-70">/mes</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                                                <span>{plan.currency} {Number(plan.costAnnual).toLocaleString()}</span>
                                                                <span className="text-[9px] opacity-70">/año</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-slate-700"
                                                            onClick={() => openPlanDialog('edit', provider.id, provider.name, plan)}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                            onClick={() => handleDeletePlan(provider.id, plan.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Provider Dialog */}
            <Dialog open={providerDialog.open} onOpenChange={(open) => setProviderDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSaveProvider}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-indigo-500" />
                                {providerDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Proveedor
                            </DialogTitle>
                            <DialogDescription>Empresa de hosting que aloja los servidores.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-5">
                            <div>
                                <Label htmlFor="p-name">Nombre de la Empresa *</Label>
                                <Input id="p-name" value={providerForm.name}
                                    onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))}
                                    required placeholder="Ej. AWS, MochaHost, 247Host" className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="p-website">Sitio Web</Label>
                                <Input id="p-website" value={providerForm.website}
                                    onChange={e => setProviderForm(f => ({ ...f, website: e.target.value }))}
                                    placeholder="https://proveedor.com" className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="p-notes">Notas y Observaciones</Label>
                                <Textarea id="p-notes" value={providerForm.notes}
                                    onChange={e => setProviderForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Información adicional, soporte, etc." className="mt-1.5 resize-none" rows={3} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div>
                                    <p className="text-sm font-medium">Proveedor Activo</p>
                                    <p className="text-xs text-slate-500">Los proveedores inactivos no aparecen en los formularios de servidor</p>
                                </div>
                                <Switch checked={providerForm.isActive}
                                    onCheckedChange={val => setProviderForm(f => ({ ...f, isActive: val }))} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setProviderDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
                            <Button type="submit">Guardar Proveedor</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Plan Dialog */}
            <Dialog open={planDialog.open} onOpenChange={(open) => setPlanDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSavePlan}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                {planDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Plan de Servidor
                            </DialogTitle>
                            <DialogDescription>
                                Plan para <span className="font-semibold text-foreground">{planDialog.providerName}</span>. Define el nombre de categoría del servidor ofrecido.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-5">
                            <div>
                                <Label htmlFor="pl-name">Nombre del Plan *</Label>
                                <Input id="pl-name" value={planForm.name}
                                    onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                                    required placeholder="Ej. VPS Small, Servidor Dedicado 8\" className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="pl-specs">Especificaciones técnicas</Label>
                                <Textarea id="pl-specs" value={planForm.specs}
                                    onChange={e => setPlanForm(f => ({ ...f, specs: e.target.value }))}
                                    placeholder="Ej. 4 vCPU, 8GB RAM, 100GB NVMe SSD, 1Gbps" className="mt-1.5 resize-none" rows={3} />
                                <p className="text-xs text-slate-400 mt-1">Recursos asignados al servidor bajo este plan.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="pl-costMonthly">Costo Mensual</Label>
                                    <Input id="pl-costMonthly" type="number" step="0.01" value={planForm.costMonthly}
                                        onChange={e => setPlanForm(f => ({ ...f, costMonthly: e.target.value }))}
                                        className="mt-1.5" />
                                </div>
                                <div>
                                    <Label htmlFor="pl-costAnnual">Costo Anual</Label>
                                    <Input id="pl-costAnnual" type="number" step="0.01" value={planForm.costAnnual}
                                        onChange={e => setPlanForm(f => ({ ...f, costAnnual: e.target.value }))}
                                        className="mt-1.5" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="pl-currency">Moneda</Label>
                                <Select value={planForm.currency} onValueChange={v => setPlanForm(f => ({ ...f, currency: v }))}>
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Seleccionar moneda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD - Dólares</SelectItem>
                                        <SelectItem value="EUR">EUR - Euros</SelectItem>
                                        <SelectItem value="MXN">MXN - Pesos Mexicanos</SelectItem>
                                        <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div>
                                    <p className="text-sm font-medium">Plan Activo</p>
                                    <p className="text-xs text-slate-500">Los planes inactivos no aparecen como opción al crear servidores</p>
                                </div>
                                <Switch checked={planForm.isActive}
                                    onCheckedChange={val => setPlanForm(f => ({ ...f, isActive: val }))} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setPlanDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
                            <Button type="submit">Guardar Plan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
