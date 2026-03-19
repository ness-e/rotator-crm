/**
 * @file Configuracion.jsx
 * @description Componente de página (Vista) para la sección Configuracion.
 * @module Frontend Page
 * @path /frontend/src/pages/Configuracion.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Settings, Save, AlertCircle, Shield, Plus, Edit, Trash2, Download, Upload, AlertTriangle, Database, Package, Clock, List, Mail, Plug } from 'lucide-react'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { PERMISSION_LABELS, ALL_PERMISSIONS } from '@/constants/permissions'
import AdminPlans from './AdminPlans'
import PendingLicensesInbox from './PendingLicensesInbox'
import AdminConstants from './AdminConstants'
import AdminEmailTemplates from './AdminEmailTemplates'
import AdminIntegrations from './AdminIntegrations'
import AdminAudit from './AdminAudit'

// ============ SETTINGS TAB ============
function SettingsTab() {
    const { toast } = useToast()
    const [settings, setSettings] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadSettings() }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const res = await api.get('/settings')
            if (res.ok) setSettings(await res.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = settings.map(s => ({ key: s.key, value: s.value }))
            const res = await api.put('/settings', payload)
            if (res.ok) toast({ title: 'Configuración guardada' })
            else throw new Error('Error saving')
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo guardar la configuración', variant: 'destructive' })
        } finally { setSaving(false) }
    }

    const grouped = settings.reduce((acc, curr) => {
        const g = curr.group || 'GENERAL'
        if (!acc[g]) acc[g] = []
        acc[g].push(curr)
        return acc
    }, {})

    if (loading) return <p>Cargando configuración...</p>

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                    {saving ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
                </Button>
            </div>

            <div className="grid gap-6">
                {Object.keys(grouped).sort().map(group => (
                    <Card key={group} className="shadow-md">
                        <CardHeader><CardTitle className="text-lg">{group}</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {grouped[group].map(setting => (
                                <div key={setting.key} className="space-y-2">
                                    <Label>{setting.description || setting.key}</Label>
                                    {setting.value === 'true' || setting.value === 'false' ? (
                                        <div className="flex items-center space-x-2 h-10">
                                            <Switch checked={setting.value === 'true'} onCheckedChange={(checked) => handleChange(setting.key, String(checked))} />
                                            <span className="text-sm text-muted-foreground">{setting.value === 'true' ? 'Activado' : 'Desactivado'}</span>
                                        </div>
                                    ) : (
                                        <Input value={setting.value} onChange={e => handleChange(setting.key, e.target.value)} />
                                    )}
                                    <p className="text-[10px] text-muted-foreground font-mono">{setting.key}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Atención</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        Algunos cambios pueden requerir un reinicio del servidor o recarga del navegador.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
}

// ============ ROLES TAB ============
function RolesTab() {
    const { toast } = useToast()
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [isNew, setIsNew] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] })
    const [open, setOpen] = useState(false)

    useEffect(() => { loadRoles() }, [])

    const loadRoles = async () => {
        setLoading(true)
        try {
            const res = await api.get('/roles')
            if (res.ok) setRoles(await res.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleEdit = (role) => {
        setEditing(role)
        setIsNew(false)
        setFormData({ name: role.name, description: role.description || '', permissions: role.permissions || [] })
        setOpen(true)
    }

    const handleNew = () => {
        setEditing(null)
        setIsNew(true)
        setFormData({ name: '', description: '', permissions: [] })
        setOpen(true)
    }

    const togglePermission = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name) return toast({ title: 'Nombre requerido', variant: 'destructive' })
        try {
            const url = isNew ? '/roles' : `/roles/${editing.name}`
            const res = await (isNew ? api.post(url, formData) : api.put(url, formData))
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Error' }))
                throw new Error(err.error)
            }
            toast({ title: isNew ? 'Rol creado' : 'Rol actualizado' })
            setOpen(false)
            loadRoles()
        } catch (err) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        }
    }

    const handleDelete = async (role) => {
        if (!window.confirm(`¿Eliminar rol ${role.name}?`)) return
        try {
            const res = await api.del(`/roles/${role.name}`)
            if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
            toast({ title: 'Rol eliminado' })
            loadRoles()
        } catch (err) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleNew} className="rounded-xl shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Cargando...</p> : roles.map(role => (
                    <Card key={role.name} className="relative group overflow-hidden border-none shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className={`absolute top-0 left-0 w-1 h-full ${role.isSystem ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">{role.name}</h3>
                                    <Badge variant="outline" className="mt-1">{role.isSystem ? 'Sistema' : 'Personalizado'}</Badge>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(role)}><Edit className="h-4 w-4" /></Button>
                                    {!role.isSystem && <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(role)}><Trash2 className="h-4 w-4" /></Button>}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{role.description || 'Sin descripción'}</p>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Permisos ({role.permissions.length})</p>
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.slice(0, 5).map(p => <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0.5">{PERMISSION_LABELS[p] || p}</Badge>)}
                                    {role.permissions.length > 5 && <Badge variant="secondary" className="text-[10px] opacity-50">+{role.permissions.length - 5}</Badge>}
                                    {role.permissions.length === 0 && <span className="text-xs text-muted-foreground italic">Ninguno</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{isNew ? 'Crear Nuevo Rol' : `Editar ${editing?.name}`}</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Nombre (ID)</label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })} disabled={!isNew} placeholder="EJEMPLO_ROL" />
                                <p className="text-xs text-muted-foreground">Solo mayúsculas y guiones bajos.</p>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Descripción</label>
                                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del rol..." />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Permisos</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                {ALL_PERMISSIONS.map(perm => (
                                    <div key={perm} className="flex items-center space-x-2">
                                        <Checkbox id={perm} checked={formData.permissions.includes(perm)} onCheckedChange={() => togglePermission(perm)} />
                                        <label htmlFor={perm} className="text-sm font-medium cursor-pointer">{PERMISSION_LABELS[perm] || perm}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Guardar Rol</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============ BACKUP TAB ============
function BackupTab() {
    const { toast } = useToast()
    const [restoring, setRestoring] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [file, setFile] = useState(null)

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const res = await api.get('/backup/download')
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `rotator-backup-${new Date().toISOString().slice(0, 10)}.sqlite`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast({ title: 'Backup descargado' })
            } else throw new Error('Error')
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo descargar el backup', variant: 'destructive' })
        } finally { setDownloading(false) }
    }

    const handleRestore = async () => {
        if (!file) return
        if (!window.confirm('ADVERTENCIA: ¿Estás seguro de restaurar? Esto sobrescribirá TODOS los datos actuales.')) return
        setRestoring(true)
        const formData = new FormData()
        formData.append('backup', file)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/backup/restore', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })
            if (res.ok) {
                toast({ title: 'Restauración completada' })
                setFile(null)
                setTimeout(() => window.location.reload(), 2000)
            } else throw new Error('Restore failed')
        } catch (e) {
            toast({ title: 'Error', description: 'Falló la restauración', variant: 'destructive' })
        } finally { setRestoring(false) }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg border-blue-100 dark:border-blue-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-blue-500" /> Exportar Datos</CardTitle>
                    <CardDescription>Descarga una copia completa de la base de datos actual.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDownload} disabled={downloading} className="w-full">
                        {downloading ? 'Descargando...' : 'Descargar Backup (.sqlite)'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4 text-center">Recomendado antes de realizar actualizaciones importantes.</p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-red-100 dark:border-red-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600"><Upload className="h-5 w-5" /> Importar / Restaurar</CardTitle>
                    <CardDescription>Restaura la base de datos desde un archivo backup.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Zona de Peligro</AlertTitle>
                        <AlertDescription>Esta acción reemplazará toda la base de datos actual.</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Input type="file" accept=".sqlite,.db" onChange={e => setFile(e.target.files[0])} />
                        {file && <p className="text-xs text-muted-foreground">Archivo: <span className="font-semibold">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span></p>}
                    </div>
                    <Button onClick={handleRestore} disabled={!file || restoring} variant="destructive" className="w-full">
                        {restoring ? 'Restaurando...' : 'Restaurar Base de Datos'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

// ============ MAIN COMPONENT ============
// Now using useSearchParams to persist tab selection in URL
import { useSearchParams } from 'react-router-dom';

export default function Configuracion() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Determine the active tab: URL param > default
    const activeTab = searchParams.get('tab') || 'sistema';

    const handleTabChange = (value) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', value);
            return newParams;
        }, { replace: true });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="page-title flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" /> Configuración
                </h1>
                <p className="page-subtitle">Gestiona la configuración del sistema, roles de usuario y copias de seguridad.</p>
            </div>

            {/* Vertical Tabs Layout */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex gap-6"
            >
                {/* Sidebar de tabs vertical */}
                <div className="w-64 flex-shrink-0">
                    <TabsList className="flex flex-col h-auto w-full space-y-1 bg-transparent p-0">
                        <TabsTrigger
                            value="sistema"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Settings className="h-4 w-4" /> Sistema
                        </TabsTrigger>
                        <TabsTrigger
                            value="roles"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Shield className="h-4 w-4" /> Roles
                        </TabsTrigger>
                        <TabsTrigger
                            value="backup"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Database className="h-4 w-4" /> Backup
                        </TabsTrigger>
                        <TabsTrigger
                            value="versiones"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Package className="h-4 w-4" /> Versiones de Licencia
                        </TabsTrigger>
                        <TabsTrigger
                            value="hosting"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Database className="h-4 w-4" /> Planes de Hosting
                        </TabsTrigger>

                        <TabsTrigger
                            value="licencias"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Clock className="h-4 w-4" /> Licencias
                        </TabsTrigger>
                        <TabsTrigger
                            value="constantes"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <List className="h-4 w-4" /> Constantes
                        </TabsTrigger>
                        <TabsTrigger
                            value="emails"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Mail className="h-4 w-4" /> Plantillas de Email
                        </TabsTrigger>
                        <TabsTrigger
                            value="integrations"
                            className="w-full h-10 justify-start gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Plug className="h-4 w-4" /> Integraciones (API)
                        </TabsTrigger>

                    </TabsList>
                </div>

                {/* Contenido de tabs con altura estandarizada */}
                <div className="flex-1">
                    <TabsContent value="sistema" className="tab-content-container m-0">
                        <SettingsTab />
                    </TabsContent>

                    <TabsContent value="roles" className="tab-content-container m-0">
                        <RolesTab />
                    </TabsContent>

                    <TabsContent value="backup" className="tab-content-container m-0">
                        <BackupTab />
                    </TabsContent>

                    <TabsContent value="versiones" className="tab-content-container m-0">
                        <AdminPlans defaultTab="versions" />
                    </TabsContent>

                    <TabsContent value="hosting" className="tab-content-container m-0">
                        <AdminPlans defaultTab="hosting" />
                    </TabsContent>



                    <TabsContent value="licencias" className="tab-content-container m-0">
                        <PendingLicensesInbox />
                    </TabsContent>

                    <TabsContent value="constantes" className="tab-content-container m-0">
                        <AdminConstants />
                    </TabsContent>

                    <TabsContent value="emails" className="tab-content-container m-0">
                        <AdminEmailTemplates />
                    </TabsContent>

                    <TabsContent value="integrations" className="tab-content-container m-0">
                        <AdminIntegrations />
                    </TabsContent>


                </div>
            </Tabs>
        </div>
    )
}
