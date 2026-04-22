/**
 * @file Configuracion.jsx
 * @description Configuración del sistema — simplificada a 4 tabs.
 * @module Frontend Page
 * @path /frontend/src/pages/Configuracion.jsx
 * @lastUpdated 2026-03-23
 */
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Settings, Save,  Shield, Plus, Edit, Trash2, Download, Upload, AlertTriangle,      X, Info } from 'lucide-react'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'
import { PERMISSION_LABELS, PERMISSION_GROUPS, PERMISSION_DESCRIPTIONS } from '@/constants/permissions'
import AdminPlans from './AdminPlans'
import AdminConstants from './AdminConstants'
import AdminEmailTemplates from './AdminEmailTemplates'
import AdminIntegrations from './AdminIntegrations'

// Constants that should not be edited via this UI
const HIDDEN_SETTINGS = [
    'DEFAULT_CURRENCY',
    'APP_NAME',
    'SITE_NAME',
    'SITE_DESCRIPTION',
    'SOFTWARE_VERSION_MAJOR',
    'SOFTWARE_VERSION_MINOR',
    'XOR_MAGIC_WORD'
]
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
        const reportEmails = settings.find(s => s.key === 'REPORT_EMAILS')?.value || '';
        const invalidEmails = reportEmails.split(',').some(email => email.trim() && !email.trim().endsWith('@rotatorsurvey.com'));
        
        if (invalidEmails) {
            return toast({ 
                title: 'Error de Validación', 
                description: 'Todos los correos de reporte deben tener el sufijo @rotatorsurvey.com', 
                variant: 'destructive' 
            });
        }
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
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Configuración protegida por perfil MASTER</span>
                </div>
                <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                    {saving ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
                </Button>
            </div>
            <div className="grid gap-6">
                {Object.keys(grouped).sort().map(group => (
                    <Card key={group} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        <CardHeader className="pb-3 border-b bg-slate-50/30 dark:bg-slate-900/40 dark:border-slate-800">
                                <CardTitle className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400">{group}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                                {grouped[group]
                                    .filter(s => !HIDDEN_SETTINGS.includes(s.key))
                                    .map(setting => (
                                    <div key={setting.key} className="space-y-2 group">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{setting.description || setting.key}</Label>
                                            {SYSTEM_HINTS[setting.key] && (
                                                <InfoHint content={SYSTEM_HINTS[setting.key]} />
                                            )}
                                        </div>
                                        {setting.key === 'REPORT_EMAILS' ? (
                                            <div className="space-y-2">
                                                <Input 
                                                    placeholder="ejemplo@rotatorsurvey.com, otro@rotatorsurvey.com"
                                                    value={setting.value}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        handleChange(setting.key, val);
                                                    }}
                                                    className={`font-mono text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary ${
                                                        setting.value.split(',').some(email => email.trim() && !email.trim().endsWith('@rotatorsurvey.com'))
                                                            ? 'border-red-500 focus-visible:ring-red-500'
                                                            : ''
                                                    }`}
                                                />
                                                {setting.value.split(',').some(email => email.trim() && !email.trim().endsWith('@rotatorsurvey.com')) && (
                                                    <p className="text-[10px] text-red-500 font-medium">Todos los correos deben terminar en @rotatorsurvey.com</p>
                                                )}
                                            </div>
                                        ) : setting.key === 'PASSWORD_POLICY' ? (
                                            <select 
                                                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                                                value={setting.value}
                                                onChange={e => handleChange(setting.key, e.target.value)}
                                            >
                                                <option value="low">Baja (Mín. 8 caracteres)</option>
                                                <option value="medium">Media (Mayús. y Núm.)</option>
                                                <option value="high">Alta (Mayús., Núm. y Símb.)</option>
                                            </select>
                                        ) : setting.value === 'true' || setting.value === 'false' ? (
                                            <div className="flex items-center space-x-2 h-10 px-1">
                                                <Switch 
                                                    checked={setting.value === 'true'} 
                                                    onCheckedChange={(checked) => handleChange(setting.key, String(checked))} 
                                                />
                                                <span className="text-sm font-medium text-slate-600">
                                                    {setting.value === 'true' ? 'Activado' : 'Desactivado'}
                                                </span>
                                            </div>
                                        ) : (
                                            <Input 
                                                value={setting.value} 
                                                onChange={e => handleChange(setting.key, e.target.value)}
                                                className="focus:border-primary"
                                            />
                                        )}
                                        <p className="text-[10px] text-muted-foreground font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                                            {setting.key}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                <Alert className="bg-slate-50 dark:bg-slate-900 border-slate-200">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-slate-900 font-bold">Información de Sistema</AlertTitle>
                    <AlertDescription className="text-slate-600">
                        Las constantes técnicas del núcleo (Versiones, XOR, Moneda) han sido bloqueadas para prevenir inconsistencias en el licenciamiento.
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
        if (role.name === 'MASTER') {
            return toast({ 
                title: 'Rol de Sistema Protegido', 
                description: 'El rol MASTER no puede ser modificado para garantizar la integridad del sistema.',
                variant: 'destructive' 
            })
        }
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
        if (role.isSystem || role.name === 'MASTER') return
        
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"? Esta acción no se puede deshacer y fallará si hay usuarios asignados.`)) return
        
        try {
            const res = await api.delete(`/roles/${role.name}`)
            if (!res.ok) { 
                const err = await res.json(); 
                throw new Error(err.error || 'Error al eliminar') 
            }
            toast({ title: 'Rol eliminado con éxito' })
            loadRoles()
        } catch (err) {
            toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' })
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
                {loading ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p>Cargando roles del sistema...</p>
                    </div>
                ) : roles.map(role => (
                    <Card key={role.name} className="relative group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${role.isSystem ? 'bg-amber-500' : 'bg-primary'}`} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{role.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={role.isSystem ? "warning" : "outline"} className="text-[10px] px-2 py-0 h-5">
                                            {role.isSystem ? 'Sistema' : 'Personalizado'}
                                        </Badge>
                                        {role.name === 'MASTER' && (
                                            <Badge className="bg-slate-900 text-white text-[10px] px-2 py-0 h-5">Root</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                                        onClick={() => handleEdit(role)}
                                        title={role.name === 'MASTER' ? 'Rol protegido' : 'Editar rol'}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {!role.isSystem && role.name !== 'MASTER' && (
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" 
                                            onClick={() => handleDelete(role)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                {role.description || 'Sin descripción detallada para este rol.'}
                            </p>
                            
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Permisos Habilitados</span>
                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {role.permissions.length}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions.slice(0, 4).map(p => (
                                        <Badge key={p} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] border-none font-normal">
                                            {PERMISSION_LABELS[p] || p.split('.')[1]}
                                        </Badge>
                                    ))}
                                    {role.permissions.length > 4 && (
                                        <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-none">
                                            +{role.permissions.length - 4} más
                                        </Badge>
                                    )}
                                    {role.permissions.length === 0 && (
                                        <span className="text-xs text-muted-foreground italic opacity-60">Sin permisos asignados</span>
                                    )}
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
                        <div className="space-y-4">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Permisos por Módulo
                            </label>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                                    <div key={group} className="space-y-3 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/20">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/70">{group}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                            {perms.map(perm => (
                                                <div key={perm} className="flex items-start space-x-3 group/item">
                                                    <Checkbox 
                                                        id={perm} 
                                                        checked={formData.permissions.includes(perm)} 
                                                        onCheckedChange={() => togglePermission(perm)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="grid gap-1 cursor-pointer" onClick={() => togglePermission(perm)}>
                                                        <label htmlFor={perm} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                            {PERMISSION_LABELS[perm] || perm}
                                                        </label>
                                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                                            {PERMISSION_DESCRIPTIONS[perm]}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
            <Card className="shadow-lg border-blue-100 dark:border-blue-900/50 bg-white dark:bg-slate-950/50">
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
            <Card className="shadow-lg border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-950">
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
                        <Input type="file" accept=".sqlite,.db" onChange={e => setFile(e.target.files[0])} className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
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
export default function Configuracion() {
    const [searchParams, setSearchParams] = useSearchParams();
    // Map legacy tab values to new structure
    const rawTab = searchParams.get('tab') || 'general';
    const activeTab = rawTab === 'sistema' ? 'general' 
        : rawTab === 'versiones' || rawTab === 'hosting' ? 'planes'
        : rawTab === 'integrations' ? 'integraciones'
        : rawTab === 'emails' ? 'email'
        : rawTab;
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
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" /> Configuración General
                </h1>
                <p className="text-muted-foreground mt-1">Gestión de parámetros del sistema, roles de usuario y mantenimiento de base de datos.</p>
            </div>
            {/* Page Content based on sidebar selection */}
            <div className="mt-4">
                {activeTab === 'general' && <SettingsTab />}
                {activeTab === 'roles' && <RolesTab />}
                {activeTab === 'planes' && <AdminPlans />}
                {activeTab === 'email' && <AdminEmailTemplates />}
                {activeTab === 'integraciones' && <AdminIntegrations />}

                {activeTab === 'backup' && <BackupTab />}
                {activeTab === 'constantes' && <AdminConstants />}
                
                {/* Fallback for legacy advanced tab */}
                {activeTab === 'avanzado' && (
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Secciones Reubicadas</AlertTitle>
                            <AlertDescription>
                                Las opciones avanzadas ahora están disponibles directamente en el menú lateral.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>
        </div>
    )
}