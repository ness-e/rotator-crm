/**
 * @file AdminPlans.jsx
 * @description Componente de página (Vista) para la sección AdminPlans.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminPlans.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Card,   CardContent } from '@/components/ui/card'
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
import {   Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/utils/api'
import InfoHint from '@/components/ui/InfoHint'
import { useTranslation } from 'react-i18next'

export default function AdminPlans({ defaultTab = null }) {
  const { t } = useTranslation()
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
  const vSchema = useMemo(() => z.object({
    id_version: z.coerce.number().int().positive().optional(),
    version_nombre: z.string().min(1, t('plans.versions.errors.required')).refine(val => val.trim().split(/\s+/).length === 2, t('plans.versions.errors.twoWords')),
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
  }), [t])

  const hSchema = useMemo(() => z.object({
    id: z.coerce.number().int().positive().optional(),
    name: z.string().min(1, t('plans.versions.errors.required')),
    abbreviation: z.string().min(1, t('plans.versions.errors.required')),
    concurrentQuestionnaires: z.coerce.number().int().min(0).default(0),
  }), [t])

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
      toast({ title: t('common.error'), description: e.error, variant: 'destructive' });
      return
    }
    toast({ title: editingV ? t('plans.versions.edit') : t('plans.versions.create') })
    setOpenV(false); setEditingV(null); vForm.reset(); loadData()
  }
  const onSubmitH = async (vals) => {
    const method = editingH ? 'PUT' : 'POST'
    const url = editingH ? `/hosting-plans/${editingH.id}` : '/hosting-plans'
    const res = await (method === 'PUT' ? api.put(url, vals) : api.post(url, vals))
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }));
      toast({ title: t('common.error'), description: e.error, variant: 'destructive' });
      return
    }
    toast({ title: editingH ? t('plans.hosting.edit') : t('plans.hosting.create') })
    setOpenH(false); setEditingH(null); hForm.reset(); loadData()
  }
  const deleteV = async (row) => {
    if (!window.confirm(t('plans.versions.deleteConfirm'))) return
    const res = await api.delete(`/catalog/license-versions/${row.id_version}`)
    if (res.ok) { toast({ title: t('common.success') }); loadData() }
  }
  const deleteH = async (row) => {
    if (!window.confirm(t('plans.hosting.deleteConfirm'))) return
    const res = await api.delete(`/hosting-plans/${row.id}`)
    if (res.ok) { toast({ title: t('common.success') }); loadData() }
  }
  // --- COLUMNS ---
  const vCols = [
    { key: 'id_version', label: 'ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'version_nombre', label: t('organizations.form.name'), render: v => <span className="font-medium">{v}</span> },
    { key: 'version_letra', label: t('plans.versions.form.letter'), render: v => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{v}</span> },
    { key: 'n_preguntas', label: t('licenses.form.questions') },
    { key: 'n_casos', label: t('licenses.form.cases') },
    { key: 'n_admins', label: t('licenses.form.admins') },
    { key: 'n_moviles', label: t('licenses.form.mobile') },
    { key: 'n_clientes', label: t('licenses.form.clients') },
    {
      key: 'hosting', label: t('plans.tabs.hosting'), render: (v) => {
        const found = hosting.find(h => h.id === v);
        return found ? found.name : (v || '-')
      }
    },
    { key: 'price_monthly', label: t('servers.monthlyCost'), render: (v) => v ? `$${v}` : '-' },
    { key: 'price_annual', label: t('servers.annualCost'), render: (v) => v ? `$${v}` : '-' },
    {
      key: 'actions', label: t('common.actions'), sortable: false, render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingV(row); vForm.reset(row); setOpenV(true) }}><Edit className="h-3 w-3 mr-1" /> {t('common.edit')}</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteV(row)}><Trash2 className="h-3 w-3 mr-1" /> {t('common.delete')}</Button>
        </div>
      )
    }
  ]
  const hCols = [
    { key: 'id', label: 'ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name', label: t('organizations.form.name'), render: v => <span className="font-medium">{v}</span> },
    { key: 'abbreviation', label: t('plans.hosting.form.abbreviation'), render: v => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{v}</span> },
    { key: 'concurrentQuestionnaires', label: t('plans.hosting.form.concurrent') },
    {
      key: 'actions', label: t('common.actions'), sortable: false, render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingH(row); hForm.reset(row); setOpenH(true) }}><Edit className="h-3 w-3 mr-1" /> {t('common.edit')}</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteH(row)}><Trash2 className="h-3 w-3 mr-1" /> {t('common.delete')}</Button>
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('plans.title')}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{t('plans.description')}</p>
          </div>
        </div>
      )}
      <Tabs defaultValue={defaultTab || "versions"} className="w-full">
        {!defaultTab && (
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="versions">{t('plans.tabs.versions')}</TabsTrigger>
            <TabsTrigger value="hosting">{t('plans.tabs.hosting')}</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="versions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <FilterBar searchValue={qv} onSearchChange={setQv} onClearFilters={() => setQv('')} placeholder={t('plans.versions.searchPlaceholder')} className="max-w-md" />
            <Dialog open={openV} onOpenChange={(v) => { setOpenV(v); if (!v) { setEditingV(null); vForm.reset() } }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> {t('plans.versions.new')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingV ? t('plans.versions.edit') : t('plans.versions.new')}</DialogTitle></DialogHeader>
                <Form {...vForm}>
                  <form onSubmit={vForm.handleSubmit(onSubmitV)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vForm.control} name="version_nombre" render={({ field }) => <FormItem><div className="flex items-center gap-2"><FormLabel>{t('plans.versions.form.name')}</FormLabel><InfoHint content="Debe tener exactamente dos palabras, ej: 'Standard Edition'." /></div><FormControl><Input {...field} placeholder="Ej: Standard Edition" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={vForm.control} name="version_letra" render={({ field }) => <FormItem><FormLabel>{t('plans.versions.form.letter')}</FormLabel><FormControl><Input {...field} className="font-mono uppercase bg-muted" readOnly /></FormControl><FormMessage /></FormItem>} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      {/* Fields */}
                      <FormField control={vForm.control} name="n_preguntas" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.questions')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_casos" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.cases')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_admins" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.admins')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_moviles" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.mobile')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_telefonicos" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.phone')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_digitadores" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.dataEntry')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_analistas" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.analysts')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_clientes" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.clients')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_clasificadores" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.classifiers')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_supervisores_captura" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.captureSup')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_supervisores_kiosco" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.kioskSup')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="n_participantes" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.participants')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                      <FormField control={vForm.control} name="cuestionarios_concurrentes" render={({ field }) => <FormItem><div className="flex items-center gap-2"><FormLabel className="text-xs">{t('plans.hosting.form.concurrent')}</FormLabel><InfoHint content="Límite de cuestionarios que pueden recibir respuestas al mismo tiempo." /></div><FormControl><Input type="number" {...field} className="bg-muted" readOnly /></FormControl><FormMessage /></FormItem>} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vForm.control} name="hosting" render={({ field }) => (
                        <FormItem><FormLabel>{t('plans.tabs.hosting')}</FormLabel>
                          <select {...field} value={field.value || ''} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                            <option value="">{t('common.searchPlaceholder')}</option>
                            {hosting.map(h => <option key={h.id} value={h.id}>{h.name} ({h.abbreviation})</option>)}
                          </select>
                        </FormItem>
                      )} />
                      <FormField control={vForm.control} name="servidor" render={({ field }) => (
                        <FormItem><FormLabel>{t('servers.node')}</FormLabel>
                          <select {...field} value={field.value || ''} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                            <option value="">{t('common.searchPlaceholder')}</option>
                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{t('servers.node')} Type {s}</option>)}
                          </select>
                        </FormItem>
                      )}
                      />
                    </div>
                    {/* Pricing Section */}
                    <div className="border p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <h3 className="font-semibold mb-3 text-sm">{t('plans.versions.form.pricing')}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={vForm.control} name="price_monthly" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('plans.versions.form.monthly')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>} />
                        <FormField control={vForm.control} name="price_annual" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('plans.versions.form.annual')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>} />
                        <FormField control={vForm.control} name="price_currency" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">{t('plans.versions.form.currency')}</FormLabel>
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
                      <Button type="submit">{editingV ? t('common.saveChanges') : t('plans.versions.create')}</Button>
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
            <FilterBar searchValue={qh} onSearchChange={setQh} onClearFilters={() => setQh('')} placeholder={t('plans.hosting.searchPlaceholder')} className="max-w-md" />
            <Dialog open={openH} onOpenChange={(v) => { setOpenH(v); if (!v) { setEditingH(null); hForm.reset() } }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> {t('plans.hosting.new')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{editingH ? t('plans.hosting.edit') : t('plans.hosting.new')}</DialogTitle></DialogHeader>
                <Form {...hForm}>
                  <form onSubmit={hForm.handleSubmit(onSubmitH)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={hForm.control} name="name" render={({ field }) => <FormItem><FormLabel>{t('organizations.form.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={hForm.control} name="abbreviation" render={({ field }) => <FormItem><FormLabel>{t('plans.hosting.form.abbreviation')}</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl><FormMessage /></FormItem>} />
                    </div>
                    <FormField control={hForm.control} name="concurrentQuestionnaires" render={({ field }) => <FormItem><FormLabel>{t('plans.hosting.form.concurrent')}</FormLabel><FormControl><Input type="number"{...field} /></FormControl><FormDescription>Límite técnico de concurrencia</FormDescription><FormMessage /></FormItem>} />
                    <DialogFooter>
                      <Button type="submit">{editingH ? t('common.saveChanges') : t('plans.hosting.create')}</Button>
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
/Tabs>
    </div>
  )
}