/**
 * @file AdminLicenses.jsx
 * @description Gestión de Licencias B2B.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminLicenses.jsx
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useForm } from 'react-hook-form'
import { Monitor, KeySquare, Loader2, Plus, RefreshCw, Copy, Trash2, Edit, AlertCircle, CheckCircle2, Server, Building2 } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/utils/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/DataTable'
import { FilterBar } from '@/components/FilterBar'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'

// --- SCHEMAS ---
const licenseSchema = z.object({
  id: z.number().optional(),
  organizationId: z.string().min(1, 'Organización requerida'),
  serialKey: z.string().optional(), // Optional for creation (auto-gen)
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  expirationDate: z.string().optional(), // Empty = Vitalicia/SaaS
  hostingType: z.enum(['CLOUD_ROTATOR', 'PRIVATE_SERVER', 'ON_PREMISE']).default('CLOUD_ROTATOR'),

  // Limits
  limitQuestions: z.coerce.number().min(0),
  limitCases: z.coerce.number().min(0),
  limitAdmins: z.coerce.number().min(1),
  limitMobileUsers: z.coerce.number().min(0),
  limitPhoneUsers: z.coerce.number().min(0),
  limitDataEntries: z.coerce.number().min(0),
  limitAnalysts: z.coerce.number().min(0),
  limitClients: z.coerce.number().min(0),
  limitClassifiers: z.coerce.number().min(0),
  limitCaptureSupervisors: z.coerce.number().min(0),
  limitKioskSupervisors: z.coerce.number().min(0),
  limitParticipants: z.coerce.number().min(0),
  concurrentQuestionnaires: z.coerce.number().min(0),

  // Meta
  productTemplateId: z.string().optional(), // Optional selection to auto-fill
})

const defaultValues = {
  organizationId: '',
  serialKey: '',
  status: 'ACTIVE',
  expirationDate: '',
  hostingType: 'CLOUD_ROTATOR',
  limitQuestions: 100,
  limitCases: 0,
  limitAdmins: 1,
  limitMobileUsers: 0,
  limitPhoneUsers: 0,
  limitDataEntries: 0,
  limitAnalysts: 0,
  limitClients: 0,
  limitClassifiers: 0,
  limitCaptureSupervisors: 0,
  limitKioskSupervisors: 0,
  limitParticipants: 0,
  concurrentQuestionnaires: 0,
  productTemplateId: ''
}

// Form Component
const LicenseForm = ({ f, onSubmitFn, isEdit, orgs = [] }) => {
  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmitFn)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          {/* Core Info */}
          <FormField control={f.control} name="organizationId" render={({ field }) => (
            <FormItem>
              <FormLabel>Organización Cliente</FormLabel>
              <FormControl>
                <select {...field} disabled={isEdit} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="">Seleccione...</option>
                  {orgs.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={f.control} name="serialKey" render={({ field }) => (
            <FormItem>
              <FormLabel>Serial (Auto-generado si vacío)</FormLabel>
              <FormControl><Input {...field} readOnly={isEdit} placeholder="Generar autom." className="font-mono" /></FormControl>
            </FormItem>
          )} />

          <FormField control={f.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <select {...field} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="ACTIVE">Activa</option>
                  <option value="INACTIVE">Inactiva</option>
                  <option value="SUSPENDED">Suspendida</option>
                </select>
              </FormControl>
            </FormItem>
          )} />

          <FormField control={f.control} name="expirationDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Expiración (Vacío = Vitalicia)</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ? field.value.slice(0, 10) : ''} /></FormControl>
            </FormItem>
          )} />
        </div>

        {/* Volumetrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-lg bg-white dark:bg-slate-950">
          <h3 className="col-span-full font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Límites Técnicos
          </h3>
          <FormField control={f.control} name="limitQuestions" render={({ field }) => <FormItem><FormLabel className="text-xs">Preguntas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitCases" render={({ field }) => <FormItem><FormLabel className="text-xs">Casos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitAdmins" render={({ field }) => <FormItem><FormLabel className="text-xs">Admins</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitMobileUsers" render={({ field }) => <FormItem><FormLabel className="text-xs">Móviles</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />

          <FormField control={f.control} name="limitPhoneUsers" render={({ field }) => <FormItem><FormLabel className="text-xs">Telefónicos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitDataEntries" render={({ field }) => <FormItem><FormLabel className="text-xs">Digitadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitAnalysts" render={({ field }) => <FormItem><FormLabel className="text-xs">Analistas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitClients" render={({ field }) => <FormItem><FormLabel className="text-xs">Clientes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />

          <FormField control={f.control} name="limitClassifiers" render={({ field }) => <FormItem><FormLabel className="text-xs">Clasificadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitParticipants" render={({ field }) => <FormItem><FormLabel className="text-xs">Participantes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitCaptureSupervisors" render={({ field }) => <FormItem><FormLabel className="text-xs">Sup. Captura</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitKioskSupervisors" render={({ field }) => <FormItem><FormLabel className="text-xs">Sup. Kiosco</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
        </div>

        {/* Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <h3 className="col-span-full font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
            <Server className="h-4 w-4" /> Infraestructura
          </h3>
          <FormField control={f.control} name="hostingType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Hosting</FormLabel>
              <FormControl>
                <select {...field} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="CLOUD_ROTATOR">Cloud Rotator</option>
                  <option value="PRIVATE_SERVER">Servidor Privado</option>
                  <option value="ON_PREMISE">On-Premise (Local)</option>
                </select>
              </FormControl>
            </FormItem>
          )} />
          <FormField control={f.control} name="concurrentQuestionnaires" render={({ field }) => <FormItem><FormLabel>Cuestionarios Concurrentes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => f.reset()}>Restaurar</Button>
          <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Crear Licencia'}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function AdminLicenses() {
  const { toast } = useToast()

  // Data
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  // Orgs for dropdown
  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/crm/organizations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });

  // UI State
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsTarget, setActionsTarget] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [targetDelete, setTargetDelete] = useState(null)

  const form = useForm({ resolver: zodResolver(licenseSchema), defaultValues })

  useEffect(() => { reload() }, [])

  const reload = () => {
    setLoading(true)
    api.get('/licenses')
      .then(async res => {
        if (res.ok) setItems(await res.json())
      })
      .finally(() => setLoading(false))
  }

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        organizationId: Number(values.organizationId)
      };

      if (editing) {
        await api.put(`/licenses/${editing.id}`, payload);
        toast({ title: 'Licencia actualizada' });
      } else {
        await api.post('/licenses', payload);
        toast({ title: 'Licencia creada' });
      }
      setOpen(false); setEditing(null); form.reset(); reload();
    } catch (e) {
      toast({ title: 'Error', description: 'Ocurrió un error al guardar', variant: 'destructive' });
    }
  }

  const handleEdit = (item) => {
    setEditing(item);
    form.reset({
      ...item,
      organizationId: String(item.organizationId),
      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : ''
    });
    setOpen(true);
  }

  const handleDelete = async () => {
    if (!targetDelete) return;
    try {
      await api.delete(`/licenses/${targetDelete.id}`);
      toast({ title: 'Licencia eliminada' });
      setDeleteConfirmOpen(false);
      reload();
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  const handleCopyData = (item) => {
    const text = `
Serial: ${item.serialKey}
Organización: ${item.organization?.name}
Expiración: ${item.expirationDate ? item.expirationDate.split('T')[0] : 'Vitalicia'}
Móviles: ${item.limitMobileUsers} | Admins: ${item.limitAdmins}
      `.trim();
    navigator.clipboard.writeText(text);
    toast({ title: 'Datos copiados' });
  }

  const filtered = items.filter(i =>
    i.serialKey?.toLowerCase().includes(searchValue.toLowerCase()) ||
    i.organization?.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'serialKey', label: 'Serial', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'organization', label: 'Organización', render: (v, r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{r.organization?.name || 'N/A'}</span>
        </div>
      )
    },
    { key: 'status', label: 'Estado', render: (v) => <Badge variant={v === 'ACTIVE' ? 'default' : 'secondary'}>{v}</Badge> },
    { key: 'expirationDate', label: 'Expiración', render: (v) => <span className="text-sm">{v ? new Date(v).toLocaleDateString() : 'Vitalicia'}</span> },
    { key: 'limits', label: 'Límites', render: (_, r) => <span className="text-xs text-muted-foreground">M:{r.limitMobileUsers} / A:{r.limitAdmins}</span> },
    {
      key: 'actions', label: '', render: (_, r) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleCopyData(r)}><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setTargetDelete(r); setDeleteConfirmOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Licencias</h1>
          <p className="text-muted-foreground">Gestión de licencias y volúmenes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); form.reset(defaultValues) }} className="rounded-xl shadow-lg hover:scale-105 transition-all">
              <Plus className="mr-2 h-4 w-4" /> Nueva Licencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Licencia' : 'Nueva Licencia'}</DialogTitle>
              <DialogDescription>
                Complete el formulario para {editing ? 'actualizar' : 'crear'} una licencia.
              </DialogDescription>
            </DialogHeader>
            <LicenseForm f={form} onSubmitFn={onSubmit} isEdit={!!editing} orgs={orgs} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl dark:bg-slate-900/50">
        <CardContent className="p-6">
          <FilterBar searchValue={searchValue} onSearchChange={setSearchValue} />
          <DataTable columns={columns} data={filtered} loading={loading} />
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="¿Eliminar Licencia?" description="Esta acción no se puede deshacer." confirmText="Eliminar" onConfirm={handleDelete} variant="destructive" />
    </div>
  )
}
