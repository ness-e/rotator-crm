/**
 * @file AdminConstants.jsx
 * @description Componente de página (Vista) para la sección AdminConstants.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminConstants.jsx
 * @lastUpdated 2026-04-20
 * @author Sistema
 */

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Save, Plus, Trash2 } from 'lucide-react'
import { api } from '@/utils/api'
import { Info } from 'lucide-react'
import InfoHint from '@/components/ui/InfoHint'
import { SYSTEM_HINTS } from '@/utils/hints'

// Constants that should not be edited via this UI as they are system-fixed
const HIDDEN_CONSTANTS = [
    'DEFAULT_CURRENCY',
    'APP_NAME',
    'SITE_NAME',
    'SITE_DESCRIPTION',
    'SOFTWARE_VERSION_MAJOR',
    'SOFTWARE_VERSION_MINOR',
    'XOR_MAGIC_WORD'
]

export default function AdminConstants() {
    const { toast } = useToast()
    const [constants, setConstants] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')

    useEffect(() => { loadConstants() }, [])

    const loadConstants = async () => {
        setLoading(true)
        try {
            const res = await api.get('/settings')
            if (res.ok) {
                const data = await res.json()
                const map = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                setConstants(map)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = Object.entries(constants).map(([key, value]) => ({ key, value }))
            const res = await api.put('/settings', payload)
            if (res.ok) toast({ title: 'Constantes guardadas' })
            else throw new Error('Error saving')
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
        } finally { setSaving(false) }
    }

    const addConstant = () => {
        if (!newKey.trim()) return
        setConstants(prev => ({ ...prev, [newKey.toUpperCase()]: newValue }))
        setNewKey('')
        setNewValue('')
    }

    const removeConstant = async (key) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la constante ${key}?`)) return
        try {
            const res = await api.delete(`/settings/${key}`)
            if (res.ok) {
                const { [key]: _, ...rest } = constants
                setConstants(rest)
                toast({ title: 'Constante eliminada' })
            } else if (res.status === 404) {
                // If it doesn't exist on the server yet, just remove from local state
                const { [key]: _, ...rest } = constants
                setConstants(rest)
                toast({ title: 'Constante descartada' })
            } else {
                throw new Error('Error deleting')
            }
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo eliminar la constante', variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Constantes del Sistema</h2>
                    <p className="text-muted-foreground">Variables globales de configuración técnica</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Todo</>}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agregar Variable</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid gap-2 w-1/3">
                        <Label>Clave (KEY)</Label>
                        <Input value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} placeholder="NUEVA_CONSTANTE" />
                    </div>
                    <div className="grid gap-2 flex-1">
                        <Label>Valor</Label>
                        <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Valor..." />
                    </div>
                    <Button onClick={addConstant} variant="secondary"><Plus className="mr-2 h-4 w-4" /> Agregar</Button>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {Object.entries(constants)
                    .filter(([key]) => !HIDDEN_CONSTANTS.includes(key))
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([key, value]) => (
                        <Card key={key} className="p-4 flex items-center gap-4 transition-all hover:border-primary/20">
                            <div className="flex items-center gap-2 w-1/3">
                                <div className="font-mono font-bold text-sm truncate" title={key}>{key}</div>
                                <InfoHint content={SYSTEM_HINTS[key]} />
                            </div>
                            <Input value={value} onChange={e => setConstants(prev => ({ ...prev, [key]: e.target.value }))} className="flex-1" />
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeConstant(key)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Card>
                    ))}
                
                {Object.entries(constants).some(([key]) => HIDDEN_CONSTANTS.includes(key)) && (
                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 mb-4 px-1">
                            <Info className="h-4 w-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Variables fijas del núcleo</span>
                        </div>
                        <div className="grid gap-2">
                            {Object.entries(constants)
                                .filter(([key]) => HIDDEN_CONSTANTS.includes(key))
                                .sort((a, b) => a[0].localeCompare(b[0]))
                                .map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-200 group hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-xs text-slate-700">{key}</span>
                                            <InfoHint content={SYSTEM_HINTS[key]} />
                                        </div>
                                        <span className="font-mono text-xs bg-white px-3 py-1 rounded-md border shadow-inner text-slate-600">{value}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
