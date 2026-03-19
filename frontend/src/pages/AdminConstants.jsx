/**
 * @file AdminConstants.jsx
 * @description Componente de página (Vista) para la sección AdminConstants.
 * @module Frontend Page
 * @path /frontend/src/pages/AdminConstants.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Save, Plus, Trash2 } from 'lucide-react'
import { api } from '@/utils/api'

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

    const removeConstant = (key) => {
        const { [key]: _, ...rest } = constants
        setConstants(rest)
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
                {Object.entries(constants).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => (
                    <Card key={key} className="p-4 flex items-center gap-4">
                        <div className="font-mono font-bold w-1/3 text-sm truncate" title={key}>{key}</div>
                        <Input value={value} onChange={e => setConstants(prev => ({ ...prev, [key]: e.target.value }))} />
                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removeConstant(key)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    )
}
