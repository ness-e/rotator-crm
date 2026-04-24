/**
 * @file AdminIntegrations.jsx
 * @description Componente de página (Vista) para la sección AdminIntegrations.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminIntegrations.jsx
 */

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/use-toast'
import { Save, Eye, EyeOff, Mail } from 'lucide-react'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'


export default function AdminIntegrations() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [visibleKeys, setVisibleKeys] = useState({})

    const integrationGroups = React.useMemo(() => [
        {
            id: 'paypal',
            name: t('integrations.groups.paypal'),
            icon: <span className="font-bold text-lg">P</span>,
            fields: [
                { key: 'PAYPAL_CLIENT_ID', label: t('integrations.fields.clientId'), type: 'text' },
                { key: 'PAYPAL_CLIENT_SECRET', label: t('integrations.fields.clientSecret'), type: 'password' }
            ]
        },
        {
            id: 'smtp',
            name: t('integrations.groups.smtp'),
            icon: <Mail className="h-5 w-5" />,
            fields: [
                { key: 'SMTP_HOST', label: t('integrations.fields.host'), type: 'text' },
                { key: 'SMTP_PORT', label: t('integrations.fields.port'), type: 'number' },
                { key: 'SMTP_USER', label: t('integrations.fields.user'), type: 'text' },
                { key: 'SMTP_PASS', label: t('integrations.fields.pass'), type: 'password' }
            ]
        }
    ], [t])

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const res = await api.get('/settings')
            if (res.ok) {
                const data = await res.json()
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
                toast({ title: t('integrations.saveSuccess') })
            } else {
                throw new Error('Error saving')
            }
        } catch (e) {
            toast({ title: t('common.error'), description: t('integrations.saveError'), variant: 'destructive' })
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

    if (loading) return <div className="p-8 text-center text-muted-foreground">{t('integrations.loading')}</div>

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('integrations.title')}</h2>
                    <p className="text-muted-foreground">{t('integrations.description')}</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? t('constants.saving') : t('common.saveChanges')}
                </Button>
            </div>

            <div className="grid gap-6">
                {integrationGroups.map(group => (
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
                                    <div className="flex items-center sm:justify-end gap-2 text-muted-foreground">
                                        <Label className="cursor-pointer">{field.label}</Label>
                                        {SYSTEM_HINTS[field.key] && <InfoHint content={SYSTEM_HINTS[field.key]} />}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={field.type === 'password' && !visibleKeys[field.key] ? 'password' : 'text'}
                                            value={settings[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            placeholder={field.default || t('integrations.fields.notConfigured')}
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
