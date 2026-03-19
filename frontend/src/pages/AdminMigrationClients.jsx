/**
 * @file AdminMigrationClients.jsx
 * @description Componente de página (Vista) para la sección AdminMigrationClients.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminMigrationClients.jsx
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
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Users, Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function AdminMigrationClients() {
    const { toast } = useToast()
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null })

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        setLoading(true)
        try {
            const res = await api.get('/migration-clients')
            if (res.ok) {
                setClients(await res.json())
            }
        } catch (error) {
            console.error('Error loading migration clients:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los clientes',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = {
            empresa: formData.get('empresa'),
            contacto: formData.get('contacto'),
            correo: formData.get('correo'),
            servidor: formData.get('servidor'),
            observations: formData.get('observations'),
            status: formData.get('status')
        }

        try {
            const res = dialog.mode === 'create'
                ? await api.post('/migration-clients', data)
                : await api.put(`/migration-clients/${dialog.data.id}`, data)

            if (res.ok) {
                toast({ title: 'Éxito', description: `Cliente ${dialog.mode === 'create' ? 'creado' : 'actualizado'}` })
                setDialog({ open: false, mode: 'create', data: null })
                loadClients()
            } else {
                throw new Error('Failed to save client')
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar el cliente', variant: 'destructive' })
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return

        try {
            const res = await api.delete(`/migration-clients/${id}`)
            if (res.ok) {
                toast({ title: 'Éxito', description: 'Cliente eliminado' })
                loadClients()
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el cliente', variant: 'destructive' })
        }
    }

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await api.patch(`/migration-clients/${id}/status`, { status })
            if (res.ok) {
                toast({ title: 'Éxito', description: 'Estado actualizado' })
                loadClients()
            }
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
        }
    }

    const getStatusBadge = (status) => {
        const config = {
            pending: { variant: 'outline', icon: Clock, label: 'Pendiente' },
            in_progress: { variant: 'default', icon: Clock, label: 'En Proceso' },
            completed: { variant: 'default', icon: CheckCircle, label: 'Completado' },
            cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelado' }
        }
        const { variant, icon: Icon, label } = config[status] || config.pending
        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        )
    }

    const stats = {
        total: clients.length,
        pending: clients.filter(c => c.status === 'pending').length,
        inProgress: clients.filter(c => c.status === 'in_progress').length,
        completed: clients.filter(c => c.status === 'completed').length
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    Clientes por Migrar
                </h1>
                <p className="text-muted-foreground mt-1">Gestión de clientes pendientes de migración</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Pendientes</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">En Proceso</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Completados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => setDialog({ open: true, mode: 'create', data: null })}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            {/* Clients List */}
            <div className="grid grid-cols-1 gap-4">
                {clients.map((client) => (
                    <Card key={client.id} className="rounded-xl">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{client.empresa}</CardTitle>
                                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                        {client.contacto && <div>Contacto: {client.contacto}</div>}
                                        {client.correo && <div>Email: {client.correo}</div>}
                                        {client.servidor && <div>Servidor: {client.servidor}</div>}
                                    </div>
                                </div>
                                {getStatusBadge(client.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {client.observations && (
                                <p className="text-sm text-muted-foreground mb-4">{client.observations}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Select
                                    value={client.status}
                                    onValueChange={(value) => handleUpdateStatus(client.id, value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="in_progress">En Proceso</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDialog({ open: true, mode: 'edit', data: client })}
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(client.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog */}
            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent>
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{dialog.mode === 'create' ? 'Nuevo' : 'Editar'} Cliente</DialogTitle>
                            <DialogDescription>Completa los datos del cliente a migrar</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label htmlFor="empresa">Empresa *</Label>
                                <Input id="empresa" name="empresa" defaultValue={dialog.data?.empresa} required />
                            </div>
                            <div>
                                <Label htmlFor="contacto">Contacto</Label>
                                <Input id="contacto" name="contacto" defaultValue={dialog.data?.contacto} />
                            </div>
                            <div>
                                <Label htmlFor="correo">Correo</Label>
                                <Input id="correo" name="correo" type="email" defaultValue={dialog.data?.correo} />
                            </div>
                            <div>
                                <Label htmlFor="servidor">Servidor</Label>
                                <Input id="servidor" name="servidor" defaultValue={dialog.data?.servidor} />
                            </div>
                            <div>
                                <Label htmlFor="status">Estado</Label>
                                <Select name="status" defaultValue={dialog.data?.status || 'pending'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="in_progress">En Proceso</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="observations">Observaciones</Label>
                                <Input id="observations" name="observations" defaultValue={dialog.data?.observations} />
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
