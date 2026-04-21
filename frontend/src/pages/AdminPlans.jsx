/**
 * @file AdminPlans.jsx
 * @description Componente de página (Vista) para la sección AdminPlans.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminPlans.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { DataTable } from '@/components/DataTable'
import { FilterBar } from '@/components/FilterBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Server, Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/utils/api'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'

export default function AdminPlans({ defaultTab = null }) {
  const { toast } = useToast()

  // Data State
  const [versions, setVersions] = useState([])
  const [hosting, setHosting] = useState([])
  const [loading, setLoading] = useState(true)

  // Search State
  const [qv, setQv] = useState('')
  const [qh, setQh] = useState('')

  // Modal State
  const [openV, setOpenV] = useState(false)
  const [editingV, setEditingV] = useState(null)
  const [openH, setOpenH] = useState(false)
  const [editingH, setEditingH] = useState(null)

  // --- SCHEMAS ---
  const vSchema = z.object({
    id_version: z.coerce.number().int().positive().optional(),
    version_nombre: z.string().min(1, 'Requerido').refine(val => val.trim().split(/\s+/).length === 2, 'Debe tener exactamente 2 palabras'),
    version_letra: z.string().min(1, 'Autogenerado'),
    n_preguntas: z.coerce.number().int().min(0).default(0),
    n_casos: z.coerce.number().int().min(0).default(0),
    n_admins: z.coerce.number().int().min(0).default(0),
    n_moviles: z.coerce.number().int().min(0).default(0),
    n_telefonicos: z.coerce.number().int().min(0).default(0),
    n_digitadores: z.coerce.number().int().min(0).default(0),
    n_analistas: z.coerce.number().int().min(0).default(0),
    n_clientes: z.coerce.number().int().min(0).default(1),
    n_clasificadores: z.coerce.number().int().min(0).default(0),
    n_supervisores_captura: z.coerce.number().int().min(0).default(0),
    n_supervisores_kiosco: z.coerce.number().int().min(0).default(0),
    n_participantes: z.coerce.number().int().min(0).default(0),
    hosting: z.coerce.number().int().nullable().optional(),
    cuestionarios_concurrentes: z.coerce.number().int().min(0).default(0),
    servidor: z.coerce.number().int().nullable().optional(),
    // Pricing fields
    price_monthly: z.coerce.number().min(0).optional(),
    price_annual: z.coerce.number().min(0).optional(),
    price_currency: z.string().default('USD'),
  })

  const hSchema = z.object({
    id: z.coerce.number().int().positive().optional(),
    name: z.string().min(1, 'Requerido'),
    abbreviation: z.string().min(1, 'Requerido'),
    concurrentQuestionnaires: z.coerce.number().int().min(0).default(0),
  })

  const vForm = useForm({
    resolver: zodResolver(vSchema),
    defaultValues: {
      id_version: '',
      version_nombre: '',
      version_letra: '',
      n_preguntas: 0,
      n_casos: 0,
      n_admins: 0,
      n_moviles: 0,
      n_telefonicos: 0,
      n_digitadores: 0,
      n_analistas: 0,
      n_clientes: 1,
      n_clasificadores: 0,
      n_supervisores_captura: 0,
      n_supervisores_kiosco: 0,
      n_participantes: 0,
      hosting: null,
      cuestionarios_concurrentes: 0,
      servidor: null,
      price_monthly: 0,
      price_annual: 0,
      price_currency: 'USD'
    }
  })

  const hForm = useForm({
    resolver: zodResolver(hSchema),
    defaultValues: { id: '', name: '', abbreviation: '', concurrentQuestionnaires: 0 }
  })

  // Watchers for Automation
  const wName = vForm.watch('version_nombre')
  const wHosting = vForm.watch('hosting')

  useEffect(() => {
    if (!wName) return
    const words = wName.trim().split(/\s+/)
    if (words.length === 2) {
      const code = (words[0][0] + words[1][1]).toUpperCase()
      vForm.setValue('version_letra', code)
    }
  }, [wName, vForm])

  useEffect(() => {
    if (!wHosting) return;
    const h = hosting.find(x => x.id_hosting === Number(wHosting))
    if (h) {
      vForm.setValue('cuestionarios_concurrentes', h.cuestionarios_c || 0)
    }
  }, [wHosting, hosting, vForm])

  // --- LOADING ---
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // Load independently so one failing endpoint doesn't block the other
    try {
      const v = await api.get('/catalog/license-versions')
      if (v.ok) setVersions(await v.json())
    } catch (e) { console.error('Error loading versions:', e) }
    try {
      const h = await api.get('/hosting-plans')
      if (h.ok) setHosting(await h.json())
    } catch (e) { console.error('Error loading hosting plans:', e) }
    setLoading(false)
  }

  // --- ACTIONS ---
  const onSubmitV = async (vals) => {
    // Convert empty strings to null if needed
    if (!vals.hosting) vals.hosting = null;
    if (!vals.servidor) vals.servidor = null;

    const method = editingV ? 'PUT' : 'POST'
    const url = editingV ? `/catalog/license-versions/${editingV.id_version}` : '/catalog/license-versions'
    const res = await (method === 'PUT' ? api.put(url, vals) : api.post(url, vals))
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }));
      toast({ title: 'Error', description: e.error, variant: 'destructive' });
      return
    }

    toast({ title: editingV ? 'Versión actualizada' : 'Versión creada' })
    setOpenV(false); setEditingV(null); vForm.reset(); loadData()
  }

  const onSubmitH = async (vals) => {
    const method = editingH ? 'PUT' : 'POST'
    const url = editingH ? `/hosting-plans/${editingH.id}` : '/hosting-plans'
    const res = await (method === 'PUT' ? api.put(url, vals) : api.post(url, vals))
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }));
      toast({ title: 'Error', description: e.error, variant: 'destructive' });
      return
    }

    toast({ title: editingH ? 'Hosting actualizado' : 'Hosting creado' })
    setOpenH(false); setEditingH(null); hForm.reset(); loadData()
  }

  const deleteV = async (row) => {
    if (!window.confirm('¿Eliminar versión?')) return
    const res = await api.delete(`/catalog/license-versions/${row.id_version}`)
    if (res.ok) { toast({ title: 'Versión eliminada' }); loadData() }
  }

  const deleteH = async (row) => {
    if (!window.confirm('¿Eliminar hosting?')) return
    const res = await api.delete(`/hosting-plans/${row.id}`)
    if (res.ok) { toast({ title: 'Hosting eliminado' }); loadData() }
  }

  // --- COLUMNS ---
  const vCols = [
    { key: 'id_version', label: 'ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'version_nombre', label: 'Nombre', render: v => <span className="font-medium">{v}</span> },
    { key: 'version_letra', label: 'Letra', render: v => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{v}</span> },
    { key: 'n_preguntas', label: 'Preg.' },
    { key: 'n_casos', label: 'Casos' },
    { key: 'n_admins', label: 'Admins' },
    { key: 'n_moviles', label: 'Móviles' },
    { key: 'n_clientes', label: 'Clientes' },
    {
      key: 'hosting', label: 'Hosting', render: (v) => {
        const found = hosting.find(h => h.id === v);
        return found ? found.name : (v || '-')
      }
    },
    { key: 'price_monthly', label: 'Precio/Mes', render: (v) => v ? `$${v}` : '-' },
    { key: 'price_annual', label: 'Precio/Año', render: (v) => v ? `$${v}` : '-' },
    {
      key: 'actions', label: 'Acciones', sortable: false, render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingV(row); vForm.reset(row); setOpenV(true) }}><Edit className="h-3 w-3 mr-1" /> Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteV(row)}><Trash2 className="h-3 w-3 mr-1" /> Eliminar</Button>
        </div>
      )
    }
  ]

  const hCols = [
    { key: 'id', label: 'ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name', label: 'Nombre', render: v => <span className="font-medium">{v}</span> },
    { key: 'abbreviation', label: 'Abreviación', render: v => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{v}</span> },
    { key: 'concurrentQuestionnaires', label: 'Cuestionarios Conc.' },
    {
      key: 'actions', label: 'Acciones', sortable: false, render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingH(row); hForm.reset(row); setOpenH(true) }}><Edit className="h-3 w-3 mr-1" /> Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteH(row)}><Trash2 className="h-3 w-3 mr-1" /> Eliminar</Button>
        </div>
      )
    }
  ]

  // --- FILTERED DATA ---
  const fv = useMemo(() => versions.filter(v => !qv || v.version_nombre?.toLowerCase().includes(qv.toLowerCase()) || v.version_letra?.toLowerCase().includes(qv.toLowerCase())), [versions, qv])
  const fh = useMemo(() => hosting.filter(h => !qh || h.name?.toLowerCase().includes(qh.toLowerCase()) || h.abbreviation?.toLowerCase().includes(qh.toLowerCase())), [hosting, qh])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - only show if not embedded */}
      {!defaultTab && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Configuración de Planes</h1>
            <p className="text-muted-foreground mt-1 text-lg">Define las características de las versiones de licencia y planes de hosting.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue={defaultTab || "versions"} className="w-full">
        {!defaultTab && (
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="versions">Versiones de Licencia</TabsTrigger>
            <TabsTrigger value="hosting">Planes de Hosting</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="versions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <FilterBar searchValue={qv} onSearchChange={setQv} onClearFilters={() => setQv('')} placeholder="Buscar versiones..." className="max-w-md" />
            <Dialog open={openV} onOpenChange={(v) => { setOpenV(v); if (!v) { setEditingV(null); vForm.reset() } }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> Nueva Versión</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingV ? 'Editar Versión' : 'Nueva Versión'}</DialogTitle></DialogHeader>
                <Form {...vForm}>
                  <form onSubmit={vForm.handleSubmit(onSubmitV)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vForm.control} name="version_nombre" render={({ field }) => <FormItem><div className="flex items-center gap-2"><FormLabel>Nombre (2 Palabras)</FormLabel><InfoHint content="Debe tener exactamente dos palabras, ej: 'Standard Edition'." /></div><FormControl><Input {...field} placeholder="Ej: Standard Edition" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={vForm.control} name="version_letra" render={({ field }) => <FormItem><FormLabel>Letra (Auto)</FormLabel><FormControl><Input {...field} className="font-mono uppercase bg-muted" readOnly /></FormControl><FormMessage /></FormItem>} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      {/* Fields */}
                      <FormField control={vForm.control} name="n_preguntas" render={({ field }) => <FormItem><FormLabel className="text-xs">Preguntas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_casos" render={({ field }) => <FormItem><FormLabel className="text-xs">Casos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_admins" render={({ field }) => <FormItem><FormLabel className="text-xs">Admins</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_moviles" render={({ field }) => <FormItem><FormLabel className="text-xs">Móviles</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_telefonicos" render={({ field }) => <FormItem><FormLabel className="text-xs">Telefónicos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_digitadores" render={({ field }) => <FormItem><FormLabel className="text-xs">Digitadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_analistas" render={({ field }) => <FormItem><FormLabel className="text-xs">Analistas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_clientes" render={({ field }) => <FormItem><FormLabel className="text-xs">Clientes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_clasificadores" render={({ field }) => <FormItem><FormLabel className="text-xs">Clasificadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_supervisores_captura" render={({ field }) => <FormItem><FormLabel className="text-xs">Sup. Captura</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_supervisores_kiosco" render={({ field }) => <FormItem><FormLabel className="text-xs">Sup. Kiosco</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_participantes" render={({ field }) => <FormItem><FormLabel className="text-xs">Participantes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />

                      <FormField control={vForm.control} name="cuestionarios_concurrentes" render={({ field }) => <FormItem><div className="flex items-center gap-2"><FormLabel className="text-xs">Cuest. Concurrentes</FormLabel><InfoHint content="Límite de cuestionarios que pueden recibir respuestas al mismo tiempo." /></div><FormControl><Input type="number" {...field} className="bg-muted" readOnly /></FormControl><FormMessage /></FormItem>} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vForm.control} name="hosting" render={({ field }) => (
                        <FormItem><FormLabel>Plan de Hosting</FormLabel>
                          <select {...field} value={field.value || ''} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                            <option value="">Selecciona Hosting</option>
                            {hosting.map(h => <option key={h.id} value={h.id}>{h.name} ({h.abbreviation})</option>)}
                          </select>
                        </FormItem>
                      )} />
                      <FormField control={vForm.control} name="servidor" render={({ field }) => (
                        <FormItem><FormLabel>Tipo de Servidor</FormLabel>
                          <select {...field} value={field.value || ''} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                            <option value="">Selecciona Servidor</option>
                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Servidor Tipo {s}</option>)}
                          </select>
                        </FormItem>
                      )}
                      />
                    </div>

                    {/* Pricing Section */}
                    <div className="border p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <h3 className="font-semibold mb-3 text-sm">Precios (CRM)</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={vForm.control} name="price_monthly" render={({ field }) => <FormItem><FormLabel className="text-xs">Precio Mensual</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>} />
                        <FormField control={vForm.control} name="price_annual" render={({ field }) => <FormItem><FormLabel className="text-xs">Precio Anual</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>} />
                        <FormField control={vForm.control} name="price_currency" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Moneda</FormLabel>
                            <select {...field} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="MXN">MXN</option>
                              <option value="COP">COP</option>
                            </select>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit">{editingV ? 'Guardar Cambios' : 'Crear Versión'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden border-none cursor-pointer">
            <CardContent className="p-0 overflow-x-auto">
              <DataTable columns={vCols} data={fv} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosting" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <FilterBar searchValue={qh} onSearchChange={setQh} onClearFilters={() => setQh('')} placeholder="Buscar hosting..." className="max-w-md" />
            <Dialog open={openH} onOpenChange={(v) => { setOpenH(v); if (!v) { setEditingH(null); hForm.reset() } }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> Nuevo Hosting</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{editingH ? 'Editar Hosting' : 'Nuevo Hosting'}</DialogTitle></DialogHeader>
                <Form {...hForm}>
                  <form onSubmit={hForm.handleSubmit(onSubmitH)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={hForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={hForm.control} name="abbreviation" render={({ field }) => <FormItem><FormLabel>Abreviación</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl><FormMessage /></FormItem>} />
                    </div>
                    <FormField control={hForm.control} name="concurrentQuestionnaires" render={({ field }) => <FormItem><FormLabel>Cuestionarios Concurrentes</FormLabel><FormControl><Input type="number"{...field} /></FormControl><FormDescription>Límite técnico de concurrencia</FormDescription><FormMessage /></FormItem>} />
                    <DialogFooter>
                      <Button type="submit">{editingH ? 'Guardar Cambios' : 'Crear Hosting'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden border-none">
            <CardContent className="p-0">
              <DataTable columns={hCols} data={fh} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
