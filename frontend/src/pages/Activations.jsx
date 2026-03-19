/**
 * @file Activations.jsx
 * @description Componente de página (Vista) para la sección Activations.
 * @module Frontend Page
 * @path /frontend/src/pages/Activations.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'

export default function Activations() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const schema = z.object({
    id: z.coerce.number().int().positive().optional(),
    id_licencia: z.coerce.number().int(),
    clave_amarilla: z.string().min(1, 'Requerido'),
    pc_nombre: z.string().min(1, 'Requerido'),
    fecha_hora: z.string().min(4, 'Requerido')
  })
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { id: '', id_licencia: '', clave_amarilla: '', pc_nombre: '', fecha_hora: '' } })

  function reload() {
    const token = localStorage.getItem('token')
    setLoading(true)
    fetch('/api/activations', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); throw new Error(e.error || 'Error') } return r.json() })
      .then(data => setItems(data))
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return items
    // Buscar en todos los campos
    return items.filter(a => {
      const searchable = [
        String(a.id || ''),
        String(a.id_licencia || ''),
        String(a.pc_nombre || ''),
        String(a.clave_amarilla || ''),
        String(a.fecha_hora || '')
      ].join(' ').toLowerCase()
      return searchable.includes(s)
    })
  }, [items, q])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Activaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <Input placeholder="Buscar en todos los campos (ID, licencia, PC, clave, fecha)..." value={q} onChange={e => setQ(e.target.value)} style={{ width: 400 }} />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); form.reset({ id: '', id_licencia: '', clave_amarilla: '', pc_nombre: '', fecha_hora: '' }) } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); form.reset({ id: '', id_licencia: '', clave_amarilla: '', pc_nombre: '', fecha_hora: '' }) }}>Nueva Activación</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editing ? 'Editar Activación' : 'Nueva Activación'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form className="grid gap-4" onSubmit={form.handleSubmit(async (vals) => {
                    const token = localStorage.getItem('token')
                    const method = editing ? 'PUT' : 'POST'
                    const url = editing ? `/activations/${editing.id}` : '/activations'
                    const payload = { ...vals, id: Number(vals.id || editing?.id), id_licencia: Number(vals.id_licencia) }
                    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
                    if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); setError(e.error || 'Error'); toast({ title: 'Error', description: e.error || 'Error', variant: 'destructive' }); return }
                    toast({ title: editing ? 'Activación actualizada' : 'Activación creada', description: 'Los cambios se han guardado correctamente' })
                    setNotice(editing ? 'Activación actualizada' : 'Activación creada'); setTimeout(() => setNotice(''), 2000)
                    setOpen(false)
                    setEditing(null)
                    form.reset()
                    reload()
                  })}>
                    {!editing && (
                      <FormField control={form.control} name="id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID (opcional, se genera automáticamente si se omite)</FormLabel>
                          <FormControl><Input type="number" {...field} placeholder="Auto-generado" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="id_licencia" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Licencia *</FormLabel>
                          <FormControl><Input type="number" {...field} placeholder="Ej: 1" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pc_nombre" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del PC *</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: PC-OFICINA-01" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="clave_amarilla" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clave Amarilla *</FormLabel>
                        <FormControl><Input {...field} placeholder="Clave de activación" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fecha_hora" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha y Hora *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="YYYY-MM-DD HH:mm:ss"
                            {...field}
                            defaultValue={editing ? field.value : new Date().toISOString().slice(0, 19).replace('T', ' ')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={() => { setOpen(false); setEditing(null); form.reset() }}>Cancelar</Button>
                      <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          {loading && <div>Cargando...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <Table style={{ fontSize: 13 }}>
              <TableCaption>Tabla activaciones</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ID Licencia</TableHead>
                  <TableHead>PC</TableHead>
                  <TableHead>Clave Amarilla</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (<TableRow><TableCell colSpan={6}><div className="text-sm text-muted-foreground">Sin resultados</div></TableCell></TableRow>)}
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.id_licencia}</TableCell>
                    <TableCell>{a.pc_nombre}</TableCell>
                    <TableCell>{a.clave_amarilla}</TableCell>
                    <TableCell>{a.fecha_hora}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditing(a)
                          form.reset({ id: a.id, id_licencia: a.id_licencia, clave_amarilla: a.clave_amarilla || '', pc_nombre: a.pc_nombre || '', fecha_hora: a.fecha_hora || '' })
                          setOpen(true)
                        }}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          if (!window.confirm('¿Eliminar activación?')) return
                          const token = localStorage.getItem('token')
                          const res = await fetch(`/activations/${a.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                          if (res.ok) {
                            setItems(items.filter(x => x.id !== a.id))
                            toast({ title: 'Activación eliminada' })
                          } else {
                            const e = await res.json().catch(() => ({ error: 'Error' }))
                            toast({ title: 'Error', description: e.error || 'Error al eliminar', variant: 'destructive' })
                          }
                        }}>Eliminar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {notice && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxShadow: '0 10px 20px rgba(0,0,0,.3)' }}>{notice}</div>
      )}
    </div>
  )
}
