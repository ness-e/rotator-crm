/**
 * @file AdminServersAndDomains.jsx
 * @description Componente de página (Vista) para la sección AdminServersAndDomains.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminServersAndDomains.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import { Server, Globe, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { SERVER_TYPES } from '@/constants/serverTypes'

export default function AdminServersAndDomains() {
    const { toast } = useToast()
    const [servers, setServers] = useState([])
    const [domains, setDomains] = useState([])
    const [loading, setLoading] = useState(true)
    const [serverDialog, setServerDialog] = useState({ open: false, mode: 'create', data: null })
    const [domainDialog, setDomainDialog] = useState({ open: false, mode: 'create', data: null })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [serversRes, domainsRes] = await Promise.all([
                api.get('/servers'),
                api.get('/domains')
            ])

            if (serversRes.ok) setServers(await serversRes.json())
            if (domainsRes.ok) setDomains(await domainsRes.json())
        } catch (error) {
            console.error('Error loading data:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los datos',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }
    const handleSaveServer = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = {
            name: formData.get('name'),
            type: formData.get('type'),
            ip_address: formData.get('ip_address'),
            status: formData.get('status'),
            observations: formData.get('observations'),
            provider: formData.get('provider'),
            size: formData.get('size'),
            costMonthly: formData.get('costMonthly'),
            nextPaymentDate: formData.get('nextPaymentDate')
        }

        try {
            const res = serverDialog.mode === 'create'
                ? await api.post('/servers', data)
                : await api.put(`/servers/${serverDialog.data.id}`, data)

            if (res.ok) {
                toast({ title: 'Éxito', description: `Servidor ${serverDialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setServerDialog({ open: false, mode: 'create', data: null })
                loadData()
            } else {
                throw new Error('Failed to save server')
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar el servidor', variant: 'destructive' })
        }
    }

    const handleDeleteServer = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este servidor?')) return

        try {
            const res = await api.delete(`/servers/${id}`)
            if (res.ok) {
                toast({ title: 'Éxito', description: 'Servidor eliminado' })
                loadData()
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el servidor', variant: 'destructive' })
        }
    }

    const handleSaveDomain = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = {
            domain_name: formData.get('domain_name'),
            server_id: formData.get('server_id') || null,
            status: formData.get('status'),
            expires_at: formData.get('expires_at') || null,
            observations: formData.get('observations')
        }

        try {
            const res = domainDialog.mode === 'create'
                ? await api.post('/domains', data)
                : await api.put(`/domains/${domainDialog.data.id}`, data)

            if (res.ok) {
                toast({ title: 'Éxito', description: `Dominio ${domainDialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setDomainDialog({ open: false, mode: 'create', data: null })
                loadData()
            } else {
                throw new Error('Failed to save domain')
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar el dominio', variant: 'destructive' })
        }
    }

    const handleDeleteDomain = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este dominio?')) return

        try {
            const res = await api.delete(`/domains/${id}`)
            if (res.ok) {
                toast({ title: 'Éxito', description: 'Dominio eliminado' })
                loadData()
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el dominio', variant: 'destructive' })
        }
    }

    const getStatusBadge = (status) => {
        const variants = {
            active: 'default',
            inactive: 'secondary',
            maintenance: 'outline'
        }
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <Server className="h-8 w-8 text-primary" />
                    Gestión de Infraestructura
                </h1>
                <p className="text-muted-foreground mt-1">Administra servidores y dominios</p>
            </div>

            <Tabs defaultValue="servers" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="servers">Servidores</TabsTrigger>
                    <TabsTrigger value="domains">Dominios</TabsTrigger>
                </TabsList>

                <TabsContent value="servers" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setServerDialog({ open: true, mode: 'create', data: null })}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Servidor
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servers.map((server) => (
                            <Card key={server.id} className="rounded-xl">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg">{server.name}</CardTitle>
                                        </div>
                                        {getStatusBadge(server.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-sm">
                                        <span className="font-semibold">Tipo:</span> {SERVER_TYPES.find(t => t.value === server.type)?.label || server.type}
                                    </div>
                                    {server.ip_address && (
                                        <div className="text-sm">
                                            <span className="font-semibold">IP:</span> {server.ip_address}
                                        </div>
                                    )}
                                    {server.observations && (
                                        <div className="text-sm text-muted-foreground">{server.observations}</div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setServerDialog({ open: true, mode: 'edit', data: server })}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteServer(server.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="domains" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setDomainDialog({ open: true, mode: 'create', data: null })}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Dominio
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {domains.map((domain) => (
                            <Card key={domain.id} className="rounded-xl">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg">{domain.domain_name}</CardTitle>
                                        </div>
                                        {getStatusBadge(domain.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {domain.expires_at && (
                                        <div className="text-sm">
                                            <span className="font-semibold">Vence:</span> {new Date(domain.expires_at).toLocaleDateString()}
                                        </div>
                                    )}
                                    {domain.observations && (
                                        <div className="text-sm text-muted-foreground">{domain.observations}</div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDomainDialog({ open: true, mode: 'edit', data: domain })}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteDomain(domain.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Server Dialog */}
            <Dialog open={serverDialog.open} onOpenChange={(open) => setServerDialog({ ...serverDialog, open })}>
                <DialogContent>
                    <form onSubmit={handleSaveServer}>
                        <DialogHeader>
                            <DialogTitle>{serverDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Servidor</DialogTitle>
                            <DialogDescription>Completa los datos del servidor</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label htmlFor="name">Nombre *</Label>
                                <Input id="name" name="name" defaultValue={serverDialog.data?.name} required />
                            </div>
                            <div>
                                <Label htmlFor="type">Tipo *</Label>
                                <Select name="type" defaultValue={serverDialog.data?.type || '0'} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVER_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value.toString()}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="ip_address">Dirección IP</Label>
                                <Input id="ip_address" name="ip_address" defaultValue={serverDialog.data?.ip_address} />
                            </div>
                            <div>
                                <Label htmlFor="status">Estado</Label>
                                <Select name="status" defaultValue={serverDialog.data?.status || 'active'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="inactive">Inactivo</SelectItem>
                                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="observations">Observaciones</Label>
                                <Input id="observations" name="observations" defaultValue={serverDialog.data?.observations} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Domain Dialog */}
            <Dialog open={domainDialog.open} onOpenChange={(open) => setDomainDialog({ ...domainDialog, open })}>
                <DialogContent>
                    <form onSubmit={handleSaveDomain}>
                        <DialogHeader>
                            <DialogTitle>{domainDialog.mode === 'create' ? 'Nuevo' : 'Editar'} Dominio</DialogTitle>
                            <DialogDescription>Completa los datos del dominio</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label htmlFor="domain_name">Nombre de Dominio *</Label>
                                <Input id="domain_name" name="domain_name" defaultValue={domainDialog.data?.domain_name} required />
                            </div>
                            <div>
                                <Label htmlFor="server_id">Servidor</Label>
                                <Select name="server_id" defaultValue={domainDialog.data?.server_id?.toString()}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar servidor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Ninguno</SelectItem>
                                        {servers.map((server) => (
                                            <SelectItem key={server.id} value={server.id.toString()}>
                                                {server.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="expires_at">Fecha de Vencimiento</Label>
                                <Input
                                    id="expires_at"
                                    name="expires_at"
                                    type="date"
                                    defaultValue={domainDialog.data?.expires_at ? new Date(domainDialog.data.expires_at).toISOString().split('T')[0] : ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Estado</Label>
                                <Select name="status" defaultValue={domainDialog.data?.status || 'active'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="inactive">Inactivo</SelectItem>
                                        <SelectItem value="expired">Expirado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="observations">Observaciones</Label>
                                <Input id="observations" name="observations" defaultValue={domainDialog.data?.observations} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
