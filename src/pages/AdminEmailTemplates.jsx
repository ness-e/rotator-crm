/**
 * @file AdminEmailTemplates.jsx
 * @description Gestión de plantillas de correo con editor de código y vista previa en tiempo real.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminEmailTemplates.jsx
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Mail, Save, Plus, Trash2, Code, Eye, Info, AlertTriangle, Search, ChevronRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'

export default function AdminEmailTemplates() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [templates, setTemplates] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const loadTemplates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/templates')
            if (res.ok) {
                const data = await res.json()
                setTemplates(data)
                if (data.length > 0 && !selected) {
                    setSelected(data[0])
                } else if (selected) {
                    const updated = data.find(t => t.id === selected.id)
                    if (updated) setSelected(updated)
                }
            }
        } catch (e) {
            console.error('Error loading templates:', e)
        } finally {
            setLoading(false)
        }
    }, [selected])

    useEffect(() => {
        loadTemplates()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = useCallback(async () => {
        if (!selected) return

        // Validación: body vacío
        if (!selected.body || selected.body.trim().length === 0) {
            return toast({
                title: t('emails.emptyBody'),
                description: t('emails.emptyBodyDesc'),
                variant: 'destructive'
            })
        }

        setSaving(true)
        try {
            const payload = {
                ...selected,
                variables: typeof selected.variables === 'string' ? selected.variables : JSON.stringify(selected.variables)
            }
            
            const res = await api.put(`/templates/${selected.id}`, payload)
            if (res.ok) {
                toast({ title: t('emails.saveSuccess') })
                await loadTemplates()
            } else {
                throw new Error('Failed to save template')
            }
        } catch (e) {
            toast({ title: t('common.error'), description: t('emails.saveError'), variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }, [selected, loadTemplates, toast])

    const handleCreate = useCallback(async () => {
        const code = prompt(t('emails.form.newPrompt'))
        if (!code) return
        
        try {
            const res = await api.post('/templates', {
                code: code.toUpperCase().replace(/\s+/g, '_'),
                name: t('emails.form.newName'),
                subject: t('emails.form.defaultSubject'),
                body: '<html><body><h1>Hola {{name}}</h1><p>Contenido...</p></body></html>',
                variables: JSON.stringify(['name'])
            })
            if (res.ok) {
                toast({ title: t('emails.toast.created') })
                loadTemplates()
            }
        } catch (e) {
            toast({ title: t('emails.toast.createError'), variant: 'destructive' })
        }
    }, [loadTemplates, toast])

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm(t('emails.confirmDelete'))) return
        try {
            const res = await api.delete(`/templates/${id}`)
            if (res.ok) {
                toast({ title: t('emails.toast.deleted') })
                setSelected(null)
                loadTemplates()
            }
        } catch (e) {
            toast({ title: t('emails.toast.deleteError'), variant: 'destructive' })
        }
    }, [loadTemplates, toast])

    const parseVariables = (vars) => {
        try {
            if (!vars) return []
            return typeof vars === 'string' ? JSON.parse(vars) : vars
        } catch (e) {
            return []
        }
    }

    const filteredTemplates = templates.filter(t => 
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Detectar si el body tiene variables {{...}} que no están registradas
    const getUnregisteredVariables = () => {
        if (!selected?.body) return []
        const bodyVars = [...selected.body.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
        const registered = parseVariables(selected.variables)
        return bodyVars.filter(v => !registered.includes(v))
    }

    if (loading && templates.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">{t('emails.loading')}</p>
                </div>
            </div>
        )
    }

    const unregisteredVars = selected ? getUnregisteredVariables() : []

    return (
        <div className="flex h-[calc(100vh-200px)] gap-6 antialiased">
                {/* LISTADO LATERAL */}
                <Card className="w-1/4 min-w-[280px] flex flex-col shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                    <CardHeader className="py-4 px-5 border-b bg-slate-50/50 dark:bg-slate-900/40 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('emails.sidebar')}</CardTitle>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-all" onClick={handleCreate}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder={t('emails.searchPlaceholder')} 
                                className="pl-9 h-9 text-xs rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1 bg-white dark:bg-slate-950">
                        <div className="p-3 space-y-1.5">
                            {filteredTemplates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelected(t)}
                                    className={`group p-4 rounded-xl cursor-pointer transition-all border ${
                                        selected?.id === t.id 
                                            ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/10 scale-[1.02]' 
                                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-xs tracking-tight truncate w-full pr-4">
                                            {t.code}
                                        </div>
                                        <ChevronRight className={`h-4 w-4 shrink-0 transition-all ${
                                            selected?.id === t.id 
                                                ? 'text-primary-foreground opacity-100 translate-x-0' 
                                                : 'text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                                        }`} />
                                    </div>
                                    <div className={`text-[10px] mt-1 truncate ${selected?.id === t.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {t.name || t('common.notDefined')}
                                    </div>
                                </div>
                            ))}
                            {filteredTemplates.length === 0 && (
                                <div className="py-12 text-center">
                                    <Mail className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('emails.emptyList')}</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* AREA DE TRABAJO (EDITOR + PREVIEW) */}
                <div className="flex-1 flex gap-6 min-w-0">
                    {selected ? (
                        <>
                            {/* EDITOR DE CODIGO */}
                            <Card className="flex-[5] flex flex-col shadow-xl border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-black/[0.02] bg-white dark:bg-slate-950">
                                <CardHeader className="py-3 px-5 border-b bg-white dark:bg-slate-900/60 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-inner">
                                            <Code className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold tracking-tight">{selected.code}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 font-mono bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">v1.0</Badge>
                                                <span className="text-[10px] text-muted-foreground">{t('emails.editorTitle')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(selected.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button onClick={handleSave} disabled={saving} className="h-9 px-5 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                                            <Save className="mr-2 h-4 w-4" />
                                            {saving ? t('constants.saving') : t('common.saveChanges')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
                                    <div className="p-5 space-y-5 border-b bg-white dark:bg-slate-900/40 dark:border-slate-800">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">{t('emails.form.name')}</Label>
                                                    <InfoHint content={SYSTEM_HINTS.EMAIL_TEMPLATE_NAME} />
                                                </div>
                                                <Input
                                                    value={selected.name || ''}
                                                    onChange={e => setSelected({ ...selected, name: e.target.value })}
                                                    className="h-10 text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-primary focus:border-primary rounded-lg transition-all"
                                                    placeholder={t('emails.form.namePlaceholder')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">{t('emails.form.subject')}</Label>
                                                    <InfoHint content={SYSTEM_HINTS.EMAIL_TEMPLATE_SUBJECT} />
                                                </div>
                                                <Input
                                                    value={selected.subject || ''}
                                                    onChange={e => setSelected({ ...selected, subject: e.target.value })}
                                                    className="h-10 text-sm font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-primary focus:border-primary rounded-lg transition-all"
                                                    placeholder={t('emails.form.subjectPlaceholder')}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between py-1 px-1">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('emails.form.variables')}</Label>
                                                <InfoHint content={SYSTEM_HINTS.EMAIL_TEMPLATE_VARIABLES} />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {parseVariables(selected.variables).map(v => (
                                                    <InfoHint 
                                                        key={v}
                                                        content={`${t('common.active')}: ${v}. ${t('emails.preview.hint')}`}
                                                    >
                                                        <Badge variant="secondary" className="cursor-help text-[10px] h-5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors">
                                                            {`{{${v}}}`}
                                                        </Badge>
                                                    </InfoHint>
                                                ))}
                                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0 text-slate-400" onClick={() => {
                                                    const v = prompt(t('emails.form.variablePrompt'));
                                                    if (v) {
                                                        const current = parseVariables(selected.variables);
                                                        setSelected({ ...selected, variables: JSON.stringify([...current, v]) });
                                                    }
                                                }}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alerta: variables no registradas detectadas en el body */}
                                    {unregisteredVars.length > 0 && (
                                        <Alert variant="destructive" className="mx-5 mt-4 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                <span className="font-bold">{t('emails.alerts.unregistered')}</span>{' '}
                                                {unregisteredVars.map(v => `{{${v}}}`).join(', ')}.
                                                {t('emails.alerts.unregisteredDesc')}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Alerta: body vacío */}
                                    {selected.body !== undefined && selected.body.trim().length === 0 && (
                                        <Alert variant="destructive" className="mx-5 mt-4 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 [&>svg]:text-red-500 dark:[&>svg]:text-red-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="text-xs font-medium">
                                                {t('emails.alerts.emptyEditor')}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex-1 relative group/editor">
                                        <textarea
                                            className="w-full h-full p-6 font-mono text-[13px] leading-relaxed resize-none bg-[#0d1117] text-slate-200 border-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-700"
                                            value={selected.body || ''}
                                            onChange={e => setSelected({ ...selected, body: e.target.value })}
                                            spellCheck={false}
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-6 bottom-6 opacity-0 group-hover/editor:opacity-100 transition-opacity pointer-events-none">
                                            <Badge className="bg-white/10 backdrop-blur-md text-white/50 border-white/10 text-[10px]">HTML5 Editor</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* VISTA PREVIA EN CALIENTE */}
                            <Card className="flex-[4] flex flex-col shadow-xl border-slate-200 overflow-hidden bg-slate-200/30">
                                <CardHeader className="py-3 px-5 border-b bg-white/80 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                            <Eye className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('emails.preview.title')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 flex flex-col relative">
                                    <div className="flex-1 m-5 bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
                                        {/* Browser Header Simulation */}
                                        <div className="px-5 py-4 border-b bg-slate-50/80 text-[11px] text-slate-600 flex flex-col gap-1.5 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold w-12 text-slate-400">{t('emails.preview.from')}</span> 
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Rotator Survey &lt;noreply@rotatorsurvey.com&gt;</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold w-12 text-slate-400">{t('emails.preview.to')}</span> 
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">usuario@dominio.com</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold w-12 text-slate-400">{t('emails.preview.subject')}</span> 
                                                <span className="text-slate-900 font-semibold">{selected.subject || t('emails.preview.noSubject')}</span>
                                            </div>
                                        </div>
                                        
                                        {/* The Content Iframe */}
                                        <div className="flex-1 bg-white relative">
                                            <iframe
                                                title="Hot Reload Preview"
                                                className="w-full h-full border-none"
                                                srcDoc={selected.body}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="px-5 pb-5">
                                        <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-blue-100 flex items-center gap-3 shadow-sm">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <Info className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <p className="text-[10px] text-blue-700 leading-tight">
                                                {t('emails.preview.hint')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white/50 m-2 rounded-3xl">
                            <div className="p-8 bg-white rounded-full shadow-xl mb-6 ring-8 ring-slate-50 animate-bounce-slow">
                                <Mail className="h-16 w-16 text-primary/30" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('emails.emptyState.title')}</h3>
                            <p className="text-sm text-slate-500 max-w-[260px] text-center leading-relaxed">
                                {t('emails.emptyState.desc')}
                            </p>
                            <Button variant="outline" className="mt-8 rounded-full px-6" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" /> {t('emails.emptyState.create')}
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
    )
}
