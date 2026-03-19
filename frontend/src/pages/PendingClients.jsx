/**
 * @file PendingClients.jsx
 * @description Componente de página (Vista) para la sección PendingClients.
 * @module Frontend Page
 * @path /frontend/src/pages/PendingClients.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useDebouncedValue } from '@/utils/debounce'

export default function PendingClients() {
  const { toast } = useToast()
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const token = localStorage.getItem('token')
    async function load() {
      try {
        const r = await fetch('/api/licenses/with-count', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); const msg = e.error || 'Error'; toast({ title: 'Error', description: msg, variant: 'destructive' }); throw new Error(msg) }
        const list = await r.json()
        setLicenses(list)
      } catch (e) { setError(e.message || 'Error'); toast({ title: 'Error', description: e.message || 'Error', variant: 'destructive' }) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const debouncedQuery = useDebouncedValue(query, 300)
  useEffect(() => { setPage(1) }, [debouncedQuery])
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim()
    // Filtrar solo licencias sin activaciones (pendientes de activar)
    const pending = licenses.filter(l => (l._count?.activaciones ?? 0) === 0)
    if (!q) return pending
    // Buscar en todos los campos de la licencia
    return pending.filter(l => {
      const searchable = [
        String(l.id_licencia || ''),
        String(l.id_cliente || ''),
        String(l.licencia_serial || ''),
        String(l.licencia_expira || ''),
        String(l.licencia_tipo || ''),
        String(l.licencia_activador || ''),
        String(l.correo_cliente || ''),
        String(l.organizacion_cliente || ''),
        String(l.pais_cliente || ''),
        String(l.ciudad_cliente || '')
      ].join(' ').toLowerCase()
      return searchable.includes(q)
    })
  }, [licenses, debouncedQuery])

  const isAll = String(pageSize) === 'all'
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)))
  const current = Math.min(page, totalPages)
  const start = isAll ? 0 : (current - 1) * Number(pageSize)
  const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize))

  async function reload() {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const r = await fetch('/licenses/with-count', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); const msg = e.error || 'Error'; toast({ title: 'Error', description: msg, variant: 'destructive' }); throw new Error(msg) }
      setLicenses(await r.json())
    } catch (e) { setError(e.message || 'Error') }
    finally { setLoading(false) }
  }

  async function approve(l) {
    const token = localStorage.getItem('token')
    try {
      const r = await fetch(`/licenses/${l.id_licencia}/regenerate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); const msg = e.error || 'Error'; toast({ title: 'Error', description: msg, variant: 'destructive' }); throw new Error(msg) }
      toast({ title: 'Licencia aprobada/regenerada' })
      reload()
    } catch (e) { setError(e.message || 'Error') }
  }

  async function reject(l) {
    if (!window.confirm('¿Rechazar y eliminar esta licencia pendiente?')) return
    const token = localStorage.getItem('token')
    try {
      const r = await fetch(`/licenses/${l.id_licencia}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Error' })); const msg = e.error || 'Error'; toast({ title: 'Error', description: msg, variant: 'destructive' }); throw new Error(msg) }
      toast({ title: 'Licencia rechazada/eliminada' })
      reload()
    } catch (e) { setError(e.message || 'Error') }
  }

  return (
    <div className="p-6">
      {notice && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxShadow: '0 10px 20px rgba(0,0,0,.3)' }}>{notice}</div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Clientes por Activar</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Muestra las licencias que aún no han sido activadas (0 activaciones).
            Puedes aprobar/regenerar la licencia o rechazar/eliminarla.
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input placeholder="Buscar en todos los campos..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} style={{ width: 400 }} />
            <select value={String(pageSize)} onChange={e => { const v = e.target.value; setPageSize(v === 'all' ? 'all' : Number(v)); setPage(1) }} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 6, padding: '6px 10px' }} title="Cantidad por página">
              <option value="10">10</option>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="all">Todas</option>
            </select>
          </div>
          {loading && <div>Cargando...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <Table style={{ fontSize: 13 }}>
              <TableCaption>Licencias pendientes de activación (sin activaciones registradas)</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ position: 'sticky', left: 0, zIndex: 2, background: '#0b1220' }}>ID Licencia</TableHead>
                  <TableHead>ID Usuario</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Activaciones</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length === 0 && (
                  <TableRow><TableCell colSpan={7}><div className="text-sm text-muted-foreground">Sin pendientes</div></TableCell></TableRow>
                )}
                {pageItems.map(l => (
                  <TableRow key={l.id_licencia}>
                    <TableCell style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0b1220' }}>{l.id_licencia}</TableCell>
                    <TableCell>{l.id_cliente}</TableCell>
                    <TableCell>{l.licencia_serial}</TableCell>
                    <TableCell>{l.licencia_expira}</TableCell>
                    <TableCell>{l.licencia_tipo}</TableCell>
                    <TableCell>{l._count?.activaciones ?? 0}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Button size="sm" className="bg-slate-800 text-white hover:bg-slate-700" onClick={() => approve(l)}>Aprobar</Button>
                        <Button size="sm" variant="destructive" onClick={() => reject(l)}>Rechazar</Button>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/licenses'}>Abrir Licencias</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div className="text-sm text-muted-foreground">{filtered.length} pendientes</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={current <= 1}>Anterior</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={current >= totalPages}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
