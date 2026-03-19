/**
 * @file AdminIntegrations.jsx
 * @description Componente de página (Vista) para la sección AdminIntegrations.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminIntegrations.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Plug, Save, Eye, EyeOff, Bot } from 'lucide-react'

// Define known integrations to structure the UI
const INTEGRATION_GROUPS = [
    {
        id: 'openai',
        name: 'OpenAI (Inteligencia Artificial)',
        icon: <Bot className="h-5 w-5" />,
        fields: [
            { key: 'OPENAI_API_KEY', label: 'API Key', type: 'password' },
            { key: 'OPENAI_MODEL', label: 'Modelo por defecto', type: 'text', default: 'gpt-4' }
        ]
    },
    {
        id: 'paypal',
        name: 'PayPal (Pasarela de Pagos)',
        icon: <span className="font-bold text-lg">P</span>,
        fields: [
            { key: 'PAYPAL_CLIENT_ID', label: 'Client ID', type: 'text' },
            { key: 'PAYPAL_CLIENT_SECRET', label: 'Client Secret', type: 'password' }
        ]
    },
    {
        id: 'smtp',
        name: 'SMTP (Envío de Correos)',
        icon: <MailIcon />,
        fields: [
            { key: 'SMTP_HOST', label: 'Host', type: 'text' },
            { key: 'SMTP_PORT', label: 'Puerto', type: 'number' },
            { key: 'SMTP_USER', label: 'Usuario', type: 'text' },
            { key: 'SMTP_PASS', label: 'Contraseña', type: 'password' }
        ]
    }
]

function MailIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> }

export default function AdminIntegrations() {
    const { toast } = useToast()
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [visibleKeys, setVisibleKeys] = useState({})

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const res = await api.get('/settings') // Returns array
            if (res.ok) {
                const data = await res.json()
                // Convert array to object key:value
                const map = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                setSettings(map)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Prepare array for bulk update
            const updatePayload = []

            INTEGRATION_GROUPS.forEach(group => {
                group.fields.forEach(field => {
                    const value = settings[field.key]
                    if (value !== undefined) {
                        updatePayload.push({ key: field.key, value })
                    }
                })
            })

            const res = await api.put('/settings', updatePayload)

            if (res.ok) {
                toast({ title: 'Integraciones actualizadas' })
            } else {
                throw new Error('Error saving')
            }
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const toggleVisibility = (key) => {
        setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando integraciones...</div>

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Integraciones</h2>
                    <p className="text-muted-foreground">Configura las conexiones con servicios externos.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="grid gap-6">
                {INTEGRATION_GROUPS.map(group => (
                    <Card key={group.id} className="overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-md border shadow-sm text-primary">
                                    {group.icon}
                                </div>
                                <CardTitle className="text-base">{group.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-4">
                            {group.fields.map(field => (
                                <div key={field.key} className="grid sm:grid-cols-[200px_1fr] items-center gap-4">
                                    <Label className="sm:text-right text-muted-foreground">
                                        {field.label}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={field.type === 'password' && !visibleKeys[field.key] ? 'password' : 'text'}
                                            value={settings[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            placeholder={field.default || 'No configurado'}
                                            className="pr-10 font-mono text-sm"
                                        />
                                        {field.type === 'password' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                                                onClick={() => toggleVisibility(field.key)}
                                            >
                                                {visibleKeys[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
