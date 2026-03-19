/**
 * @file PendingLicensesInbox.jsx
 * @description Componente de página (Vista) para la sección PendingLicensesInbox.
 * @module Frontend Page
 * @path /frontend/src/pages/PendingLicensesInbox.jsx
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

export default function PendingLicensesInbox() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const schema = z.object({
    id: z.string().min(1, 'Requerido').optional(),
    codigo_licencia: z.string().min(1, 'Requerido'),
    correo_paypal: z.string().min(1, 'Requerido')
  })
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { id: '', codigo_licencia: '', correo_paypal: '' } })

  function reload() {
    const token = localStorage.getItem('token')
    setLoading(true)
    fetch('/api/pending-licenses', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); throw new Error(e.error || 'Error') } return r.json() })
      .then(data => setItems(data))
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    return items.filter(a => !s || (a.id || '').toLowerCase().includes(s) || (a.codigo_licencia || '').toLowerCase().includes(s) || (a.correo_paypal || '').toLowerCase().includes(s))
  }, [items, q])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Licencias en Activación (Inbox)</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <Input placeholder="Buscar (id, código, correo)" value={q} onChange={e => setQ(e.target.value)} style={{ width: 320 }} />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); form.reset({ id: '', codigo_licencia: '', correo_paypal: '' }) } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); form.reset({ id: '', codigo_licencia: '', correo_paypal: '' }) }}>Nueva Entrada</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader><DialogTitle>{editing ? 'Editar Entrada' : 'Nueva Entrada'}</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form className="grid gap-3" onSubmit={form.handleSubmit(async (vals) => {
                    const token = localStorage.getItem('token')
                    const method = editing ? 'PUT' : 'POST'
                    const url = editing ? `/pending-licenses/${editing.id}` : '/pending-licenses'
                    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...vals, id: String(vals.id || editing?.id) }) })
                    if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); setError(e.error || 'Error'); return }
                    setNotice(editing ? 'Entrada actualizada' : 'Entrada creada'); setTimeout(() => setNotice(''), 2000)
                    setOpen(false)
                    reload()
                  })}>
                    {!editing && (
                      <FormField control={form.control} name="id" render={({ field }) => (
                        <FormItem><FormLabel>ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    )}
                    <FormField control={form.control} name="codigo_licencia" render={({ field }) => (
                      <FormItem><FormLabel>Código Licencia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="correo_paypal" render={({ field }) => (
                      <FormItem><FormLabel>Correo PayPal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar</Button>
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
              <TableCaption>Tabla licencias_en_activacion</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Correo PayPal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (<TableRow><TableCell colSpan={4}><div className="text-sm text-muted-foreground">Sin resultados</div></TableCell></TableRow>)}
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.codigo_licencia}</TableCell>
                    <TableCell>{a.correo_paypal}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditing(a)
                          form.reset({ id: a.id, codigo_licencia: a.codigo_licencia || '', correo_paypal: a.correo_paypal || '' })
                          setOpen(true)
                        }}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          if (!window.confirm('¿Eliminar entrada?')) return
                          const token = localStorage.getItem('token')
                          const res = await fetch(`/pending-licenses/${a.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                          if (res.ok) { setItems(items.filter(x => x.id !== a.id)) }
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
