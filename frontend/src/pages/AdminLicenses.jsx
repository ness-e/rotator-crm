/**
 * @file AdminLicenses.jsx
 * @description Gestión de Licencias B2B.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminLicenses.jsx
 */
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm, useFieldArray } from 'react-hook-form'
import { Monitor, KeySquare,  Plus,  Copy, Trash2, Edit,   Server, Building2 } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/utils/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/DataTable'
import AdminGestionLayout from '@/components/AdminGestionLayout'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '../utils/debounce'

// Form Component
const LicenseForm = ({ f, onSubmitFn, isEdit, orgs = [], hostingPlans = [], productTemplates = [], users = [], serverNodes = [] }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: f.control,
    name: "licenseServers"
  });
  const handleTemplateChange = (val) => {
    f.setValue('productTemplateId', val);
    if (!val) {
      f.setValue('hostingPlanId', '');
      f.setValue('concurrentQuestionnaires', 0);
      return;
    }
    const template = productTemplates.find(t => String(t.id_version) === val || String(t._templateId) === val);
    if (template) {
      // 1 year from now
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      f.setValue('expirationDate', nextYear.toISOString().split('T')[0]);
      // limits
      f.setValue('limitQuestions', template.n_preguntas || 0);
      f.setValue('limitCases', template.n_casos || 0);
      f.setValue('limitAdmins', template.n_admins || 0);
      f.setValue('limitMobileUsers', template.n_moviles || 0);
      f.setValue('limitPhoneUsers', template.n_telefonicos || 0);
      f.setValue('limitDataEntries', template.n_digitadores || 0);
      f.setValue('limitAnalysts', template.n_analistas || 0);
      f.setValue('limitClients', template.n_clientes || 0);
      f.setValue('limitClassifiers', template.n_clasificadores || 0);
      f.setValue('limitCaptureSupervisors', template.n_supervisores_captura || 0);
      f.setValue('limitKioskSupervisors', template.n_supervisores_kiosco || 0);
      f.setValue('limitParticipants', template.n_participantes || 0);
      // Default hosting plan tracking
      const defaultQuest = template.cuestionarios_concurrentes || 0;
      let matchedPlanId = '';
      let assignQuest = defaultQuest;
      // Ensure template.hosting is evaluated
      if (template.hosting) {
        matchedPlanId = String(template.hosting);
        const plan = hostingPlans.find(h => String(h.id) === matchedPlanId || String(h.id_hosting) === matchedPlanId);
        if (plan) {
           assignQuest = plan.concurrentQuestionnaires ?? plan.cuestionarios_c ?? defaultQuest;
        }
      } else {
        // Fallback
        const extactMatch = hostingPlans.find(h => Number(h.concurrentQuestionnaires ?? h.cuestionarios_c ?? 0) === Number(defaultQuest));
        if (extactMatch) {
          matchedPlanId = String(extactMatch.id || extactMatch.id_hosting);
          assignQuest = extactMatch.concurrentQuestionnaires ?? extactMatch.cuestionarios_c ?? defaultQuest;
        } else {
          const validPlans = hostingPlans
            .filter(h => Number(h.concurrentQuestionnaires ?? h.cuestionarios_c ?? 0) >= Number(defaultQuest))
            .sort((a,b) => Number(a.concurrentQuestionnaires ?? a.cuestionarios_c ?? 0) - Number(b.concurrentQuestionnaires ?? b.cuestionarios_c ?? 0));
          
          if (validPlans.length > 0) {
            matchedPlanId = String(validPlans[0].id || validPlans[0].id_hosting);
            assignQuest = defaultQuest; 
          }
        }
      }
      f.setValue('hostingPlanId', matchedPlanId, { shouldValidate: true, shouldDirty: true });
      f.setValue('concurrentQuestionnaires', assignQuest, { shouldValidate: true, shouldDirty: true });
    }
  };
  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmitFn)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          {/* Core Info */}
          <FormField control={f.control} name="organizationId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.organization')}</FormLabel>
              <FormControl>
                <select {...field} disabled={isEdit} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="">{t('licenses.form.selectOrg')}</option>
                  {orgs.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={f.control} name="ownedByUserId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.user')}</FormLabel>
              <FormControl>
                <select {...field} value={field.value || ''} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="">{t('licenses.form.noUser')}</option>
                  {users.filter(u => !f.watch('organizationId') || String(u.organizationId) === String(f.watch('organizationId'))).map(u => (
                    <option key={u.id} value={String(u.id)} disabled={u.ownedLicense && u.ownedLicense.id !== f.getValues('id')}>
                      {u.firstName} {u.lastName} {u.ownedLicense && u.ownedLicense.id !== f.getValues('id') ? t('licenses.form.alreadyHasLicense') : ''}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={f.control} name="productTemplateId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.plan')}</FormLabel>
              <FormControl>
                <select value={field.value || ''} onChange={(e) => handleTemplateChange(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background">
                  <option value="">{t('licenses.form.selectPlan')}</option>
                  {productTemplates.map(t => <option key={t._templateId || t.id_version} value={String(t._templateId || t.id_version)}>{t.version_nombre || t.name}</option>)}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={f.control} name="serialKey" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.serial')}</FormLabel>
              <FormControl><Input {...field} readOnly placeholder={t('licenses.form.generateAuto')} className="font-mono bg-slate-100 dark:bg-slate-900" /></FormControl>
            </FormItem>
          )} />
          {isEdit && (
            <FormField control={f.control} name="encryptedActivationKey" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('licenses.form.activationKey')}</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly placeholder="N/A" className="font-mono bg-slate-100 dark:bg-slate-900 text-xs text-muted-foreground" /></FormControl>
              </FormItem>
            )} />
          )}
          <FormField control={f.control} name="expirationDate" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.expiration')}</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ? field.value.slice(0, 10) : ''} /></FormControl>
            </FormItem>
          )} />
        </div>
        {/* Volumetrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-lg bg-white dark:bg-slate-950">
          <h3 className="col-span-full font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
            <Monitor className="h-4 w-4" /> {t('licenses.form.limitsTechnical')}
          </h3>
          <FormField control={f.control} name="limitQuestions" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.questions')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitCases" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.cases')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitAdmins" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.admins')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitMobileUsers" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.mobile')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitPhoneUsers" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.phone')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitDataEntries" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.dataEntry')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitAnalysts" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.analysts')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitClients" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.clients')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitClassifiers" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.classifiers')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitParticipants" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.participants')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitCaptureSupervisors" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.captureSup')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
          <FormField control={f.control} name="limitKioskSupervisors" render={({ field }) => <FormItem><FormLabel className="text-xs">{t('licenses.form.kioskSup')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
        </div>
        {/* Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <h3 className="col-span-full font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
            <Server className="h-4 w-4" /> {t('navigation.infrastructure')}
          </h3>
          <FormField control={f.control} name="hostingPlanId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('licenses.form.hostingPlan')}</FormLabel>
              <FormControl>
                <select 
                  {...field} 
                  value={field.value || ''} 
                  onChange={(e) => {
                    field.onChange(e);
                    const selectedVal = e.target.value;
                    if (selectedVal) {
                      const plan = hostingPlans.find(h => String(h.id) === String(selectedVal) || String(h.id_hosting) === String(selectedVal));
                      if (plan) {
                        f.setValue('concurrentQuestionnaires', plan.concurrentQuestionnaires ?? plan.cuestionarios_c ?? 0, { shouldValidate: true, shouldDirty: true });
                      }
                    } else {
                      f.setValue('concurrentQuestionnaires', 0, { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  <option value="">{t('licenses.form.noHostingPlan')}</option>
                  {hostingPlans.map(h => <option key={h.id || h.id_hosting} value={String(h.id || h.id_hosting)}>{h.name || h.nombre} ({h.code || h.codigo})</option>)}
                </select>
              </FormControl>
            </FormItem>
          )} />
          <div className="col-span-full border rounded-md p-4 bg-white dark:bg-slate-950 mt-2 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold">{t('licenses.form.associatedServers')}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{t('licenses.form.associatedServersDesc')}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ serverId: '', domainId: '' })}>
                <Plus className="h-4 w-4 mr-1" /> {t('licenses.form.addServer')}
              </Button>
            </div>
            {fields.length === 0 && <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">{t('licenses.form.noServers')}</div>}
            
            <div className="space-y-3">
              {fields.map((field, index) => {
                const watchServerId = f.watch(`licenseServers.${index}.serverId`);
                const selectedServer = serverNodes.find(s => String(s.id) === String(watchServerId));
                const domains = selectedServer?.domains || [];
                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="md:col-span-5">
                      <FormField control={f.control} name={`licenseServers.${index}.serverId`} render={({ field: rField }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className="text-xs">{t('licenses.form.server')}</FormLabel>}
                          <FormControl>
                            <select {...rField} value={rField.value || ''} className="w-full h-9 px-3 text-sm rounded-md border bg-background">
                              <option value="">{t('licenses.form.selectServer')}</option>
                              {serverNodes.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.type}) - IP: {s.ipAddress}</option>)}
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <div className="md:col-span-6">
                      <FormField control={f.control} name={`licenseServers.${index}.domainId`} render={({ field: rField }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className="text-xs">{t('licenses.form.domainOptional')}</FormLabel>}
                          <FormControl>
                            <select {...rField} value={rField.value || ''} className="w-full h-9 px-3 text-sm rounded-md border bg-background" disabled={!watchServerId || domains.length === 0}>
                              <option value="">{t('licenses.form.noDomain')}</option>
                              {domains.map(d => <option key={d.id} value={String(d.id)}>{d.domainName}</option>)}
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9 hover:bg-destructive/10" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedServer?.type === 'NUBE' && index > 0 && (
                      <p className="text-xs text-amber-600 col-span-full">{t('licenses.form.cloudServerWarning')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <FormField control={f.control} name="concurrentQuestionnaires" render={({ field }) => <FormItem><FormLabel>{t('licenses.form.concurrentQuest')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
        </div>
        {/* Notes */}
        <div className="border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <FormField control={f.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>{t('common.notes')}</FormLabel><FormControl><textarea {...field} value={field.value || ''} rows={2} placeholder={t('licenses.form.notesPlaceholder')} className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" /></FormControl></FormItem>
          )} />
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => f.reset()}>{t('common.restore')}</Button>
          <Button type="submit">{isEdit ? t('common.saveChanges') : t('common.create')}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function AdminLicenses() {
  const { t } = useTranslation()
  const { toast } = useToast()
  
  // Data
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const debouncedSearch = useDebouncedValue(searchValue, 300)

  // Schames (Inside component to use t)
  const licenseSchema = z.object({
    id: z.number().optional(),
    organizationId: z.string().min(1, t('common.errors.required')),
    serialKey: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
    expirationDate: z.string().optional(),
    hostingPlanId: z.coerce.number().optional(),
    licenseServers: z.array(z.object({
      serverId: z.coerce.number(),
      domainId: z.preprocess((val) => val === '' ? null : val, z.coerce.number().nullable())
    })).default([]),
    ownedByUserId: z.coerce.number().optional(),
    notes: z.string().optional(),
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
    productTemplateId: z.string().optional(),
  })

  const defaultValues = {
    organizationId: '',
    serialKey: '',
    status: 'ACTIVE',
    expirationDate: '',
    hostingPlanId: '',
    licenseServers: [],
    ownedByUserId: '',
    notes: '',
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

  // Queries
  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/crm/organizations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });
  const { data: hostingPlans = [] } = useQuery({
    queryKey: ['hosting-plans'],
    queryFn: async () => {
      const res = await fetch('/api/hosting-plans', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });
  const { data: productTemplates = [] } = useQuery({
    queryKey: ['product-templates'],
    queryFn: async () => {
      const res = await fetch('/api/catalog/license-versions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });
  const { data: serverNodes = [] } = useQuery({
    queryKey: ['server-nodes'],
    queryFn: async () => {
      const res = await fetch('/api/servers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });

  // UI State
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
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
        toast({ title: t('licenses.toast.updated') });
      } else {
        await api.post('/licenses', payload);
        toast({ title: t('licenses.toast.created') });
      }
      setOpen(false); setEditing(null); form.reset(); reload();
    } catch (e) {
      toast({ title: t('common.error'), description: t('licenses.toast.saveError'), variant: 'destructive' });
    }
  }

  const handleEdit = (item) => {
    setEditing(item);
    form.reset({
      ...item,
      organizationId: String(item.organizationId),
      productTemplateId: item.productTemplateId ? String(item.productTemplateId) : '',
      hostingPlanId: item.hostingPlanId ? String(item.hostingPlanId) : '',
      licenseServers: item.licenseServers?.map(ls => ({ serverId: String(ls.serverId), domainId: ls.domainId ? String(ls.domainId) : '' })) || [],
      ownedByUserId: item.ownedByUserId ? String(item.ownedByUserId) : '',
      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
      encryptedActivationKey: item.encryptedActivationKey || ''
    });
    setOpen(true);
  }

  const handleDelete = async () => {
    if (!targetDelete) return;
    try {
      await api.delete(`/licenses/${targetDelete.id}`);
      toast({ title: t('licenses.toast.deleted') });
      setDeleteConfirmOpen(false);
      reload();
    } catch (e) {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  }

  const handleCopyData = (item) => {
    const text = `
Serial: ${item.serialKey}
${t('licenses.table.org')}: ${item.organization?.name}
${t('licenses.table.expiration')}: ${item.expirationDate ? item.expirationDate.split('T')[0] : t('common.vitalicia')}
${t('licenses.form.mobile')}: ${item.limitMobileUsers} | ${t('licenses.form.admins')}: ${item.limitAdmins}
      `.trim();
    navigator.clipboard.writeText(text);
    toast({ title: t('common.copied') });
  }

  const filtered = items.filter(i => {
    const search = debouncedSearch.toLowerCase();
    return i.serialKey?.toLowerCase().includes(search) ||
           i.organization?.name?.toLowerCase().includes(search);
  });

  const isAll = String(pageSize) === 'all';
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const currentPage = Math.min(page, totalPages);
  const start = isAll ? 0 : (currentPage - 1) * Number(pageSize);
  const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize));

  const columns = [
    { key: 'serialKey', label: t('licenses.table.serial'), render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'organization', label: t('licenses.table.org'), render: (v, r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{r.organization?.name || t('common.na')}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      label: t('licenses.table.status'), 
      render: (v) => <Badge variant={v === 'ACTIVE' ? 'default' : 'secondary'}>{t(`licenses.status.${v}`)}</Badge> 
    },
    { 
      key: 'expirationDate', 
      label: t('licenses.table.expiration'), 
      render: (v) => <span className="text-sm">{v ? new Date(v).toLocaleDateString() : t('common.vitalicia')}</span> 
    },
    { 
      key: 'limits', 
      label: t('licenses.table.limits'), 
      render: (_, r) => <span className="text-xs text-muted-foreground">M:{r.limitMobileUsers} / A:{r.limitAdmins}</span> 
    },
    {
      key: 'activations', label: t('licenses.table.activations'), render: (_, r) => {
        const count = r.activations?.length ?? 0
        return count === 0
          ? <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 text-xs">{t('licenses.table.noActivations')}</Badge>
          : <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('licenses.table.activationsCount', { count })}</span>
      }
    },
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
    <>
      <AdminGestionLayout
        title={t('licenses.title')}
        description={t('licenses.description')}
        icon={KeySquare}
        searchValue={searchValue}
        onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
        pageSize={pageSize}
        onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setPage}
        searchPlaceholder={t('licenses.searchPlaceholder')}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); form.reset(defaultValues) }} className="rounded-xl shadow-lg hover:scale-105 transition-all">
                <Plus className="mr-2 h-4 w-4" /> {t('licenses.new')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? t('licenses.edit') : t('licenses.form.newB2B')}</DialogTitle>
                <DialogDescription>{t('licenses.form.descriptionB2B')}</DialogDescription>
              </DialogHeader>
              <LicenseForm f={form} onSubmitFn={onSubmit} isEdit={!!editing} orgs={orgs} hostingPlans={hostingPlans} productTemplates={productTemplates} users={users} serverNodes={serverNodes} />
            </DialogContent>
          </Dialog>
        }
      >
        <DataTable columns={columns} data={pageItems} loading={loading} />
      </AdminGestionLayout>
      <ConfirmDialog 
        open={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen} 
        title={t('licenses.deleteTitle')} 
        description={t('licenses.deleteDescription')} 
        confirmText={t('common.delete')} 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </>
  )
}