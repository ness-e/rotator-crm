/**
 * @file AdminEmailTemplates.jsx
 * @description Componente de página (Vista) para la sección AdminEmailTemplates.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminEmailTemplates.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Mail, Save, Plus, Trash2, Code, FileText } from 'lucide-react'

export default function AdminEmailTemplates() {
    const { toast } = useToast()
    const [templates, setTemplates] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        setLoading(true)
        try {
            const res = await api.get('/templates')
            if (res.ok) {
                const data = await res.json()
                setTemplates(data)
                if (data.length > 0 && !selected) setSelected(data[0])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selected) return
        setSaving(true)
        try {
            const res = await api.put(`/templates/${selected.id}`, selected)
            if (res.ok) {
                toast({ title: 'Plantilla guardada' })
                loadTemplates()
            } else {
                throw new Error('Error saving')
            }
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo guardar la plantilla', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleCreate = async () => {
        const code = prompt('Código único (ej. WELCOME_NEW):')
        if (!code) return
        try {
            const res = await api.post('/templates', {
                code: code.toUpperCase(),
                name: 'Nueva Plantilla',
                subject: 'Asunto del correo',
                body: 'Contenido del correo...',
                variables: '[]' // JSON string
            })
            if (res.ok) {
                toast({ title: 'Plantilla creada' })
                loadTemplates()
            }
        } catch (e) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    if (loading && templates.length === 0) return <div className="p-8 text-center text-muted-foreground">Cargando plantillas...</div>

    return (
        <div className="flex h-[calc(100vh-200px)] gap-6">
            {/* Sidebar List */}
            <Card className="w-1/3 min-w-[250px] flex flex-col border-none shadow-md">
                <CardHeader className="py-4 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Plantillas</CardTitle>
                        <Button size="sm" variant="ghost" onClick={handleCreate}><Plus className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {templates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setSelected(t)}
                                className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${selected?.id === t.id ? 'bg-primary/10 border-primary/20 border' : ''}`}
                            >
                                <div className="font-medium text-sm flex items-center justify-between">
                                    {t.name || t.code}
                                    {selected?.id === t.id && <Badge variant="secondary" className="text-[10px] h-5">Editar</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {t.subject}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Editor Area */}
            <Card className="flex-1 flex flex-col border-none shadow-md overflow-hidden">
                {selected ? (
                    <>
                        <CardHeader className="py-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-primary" />
                                        {selected.code}
                                    </CardTitle>
                                    <CardDescription>
                                        Editando plantilla de correo electrónico
                                    </CardDescription>
                                </div>
                                <Button onClick={handleSave} disabled={saving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid gap-2">
                                <Label>Nombre Descriptivo</Label>
                                <Input
                                    value={selected.name}
                                    onChange={e => setSelected({ ...selected, name: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Asunto del Correo</Label>
                                <Input
                                    value={selected.subject}
                                    onChange={e => setSelected({ ...selected, subject: e.target.value })}
                                    className="font-medium"
                                />
                            </div>

                            <div className="grid gap-2 flex-1 h-full min-h-[300px]">
                                <Label className="flex justify-between">
                                    <span>Cuerpo (HTML habilitado)</span>
                                    <span className="text-xs text-muted-foreground">Variables disponibles: {selected.variables || 'Ninguna'}</span>
                                </Label>
                                <Textarea
                                    value={selected.body}
                                    onChange={e => setSelected({ ...selected, body: e.target.value })}
                                    className="font-mono text-sm leading-relaxed min-h-[300px] resize-none p-4"
                                />
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Mail className="h-16 w-16 mb-4" />
                        <p>Selecciona una plantilla para editar</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
