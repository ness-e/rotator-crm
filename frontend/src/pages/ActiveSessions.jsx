/**
 * @file ActiveSessions.jsx
 * @description Componente de página (Vista) para la sección ActiveSessions.
 * @module Frontend Page
 * @path /frontend/src/pages/ActiveSessions.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Monitor, ClipboardCopy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import HelpHint from '@/components/ui/HelpHint'
import { api } from '@/utils/api'
import { copyToClipboard } from '@/utils/copy'

export default function ActiveSessions(){
  const { toast } = useToast()
  const [licenseId, setLicenseId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pcQuery, setPcQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function fetchByLicense(id){
    if(!id) return
    setLoading(true); setError(''); setItems([])
    try{
      const r = await api.get(`/licenses/${id}/activations`)
      if(!r.ok){ const e=await r.json().catch(()=>({error:'Error'})); const msg=e.error||'Error'; toast({ title:'Error', description: msg, variant:'destructive' }); throw new Error(msg) }
      const list = await r.json()
      setItems(list||[])
    }catch(e){ setError(e.message||'Error') }
    finally{ setLoading(false) }
  }

  return (
    <div style={{ padding:20 }}>
      {notice && (
        <div style={{ position:'fixed', right:16, bottom:16, background:'#0f172a', color:'#fff', border:'1px solid #334155', borderRadius:8, padding:'10px 12px', boxShadow:'0 10px 20px rgba(0,0,0,.3)' }}>{notice}</div>
      )}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:12}}>
        <div className="flex items-center gap-2">
          <h2 style={{ fontWeight:600 }}>Sesiones Activas</h2>
          <HelpHint title="Sesiones Activas">Consulta y filtra las activaciones por licencia, PC y fecha. Puedes copiar la clave amarilla.</HelpHint>
        </div>
        <div className="flex items-center gap-2 flex-wrap" style={{ rowGap:8 }}>
          <Input placeholder="ID de Licencia" value={licenseId} onChange={e=> setLicenseId(e.target.value)} style={{ width:180 }} />
          <Input placeholder="PC contiene" value={pcQuery} onChange={e=>{ setPcQuery(e.target.value); setPage(1) }} style={{ width:160 }} />
          <Input type="date" placeholder="Desde" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setPage(1) }} style={{ width:150 }} />
          <Input type="date" placeholder="Hasta" value={dateTo} onChange={e=>{ setDateTo(e.target.value); setPage(1) }} style={{ width:150 }} />
          <select value={String(pageSize)} onChange={e=>{ const v=e.target.value; setPageSize(v==='all'?'all':Number(v)); setPage(1) }} style={{ background:'#0f172a', border:'1px solid #334155', color:'#fff', borderRadius:6, padding:'6px 10px' }} title="Cantidad por página">
            <option value="10">10</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
            <option value="all">Todas</option>
          </select>
          <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={()=>{ setPage(1); fetchByLicense(licenseId) }}>Buscar</Button>
        </div>
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <Table style={{ fontSize:13 }}>
        <TableCaption>Resultados de activaciones {items.length>0?`· ${items.length}`:''}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead style={{ position:'sticky', left:0, zIndex:2, background:'#0b1220' }}>ID Activación</TableHead>
            <TableHead>PC</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Clave Amarilla</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!items || items.length===0) && (
            <TableRow>
              <TableCell colSpan={5}><div className="text-sm text-muted-foreground">Sin resultados</div></TableCell>
            </TableRow>
          )}
          {(()=>{
            const filtered = (items||[]).filter(a=>{
              const pcOk = pcQuery.trim() ? String(a.pc_nombre||'').toLowerCase().includes(pcQuery.toLowerCase().trim()) : true
              const f = (a.fecha_hora||'').slice(0,10)
              const fromOk = dateFrom ? (f >= dateFrom) : true
              const toOk = dateTo ? (f <= dateTo) : true
              return pcOk && fromOk && toOk
            })
            const isAll = String(pageSize)==='all'
            const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)))
            const current = Math.min(page, totalPages)
            const start = isAll ? 0 : (current - 1) * Number(pageSize)
            const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize))
            return pageItems.map(a=> (
              <TableRow key={a.id_activacion || `${a.pc_nombre}-${a.fecha_hora}`}>
                <TableCell style={{ position:'sticky', left:0, zIndex:1, background:'#0b1220' }}>{a.id_activacion || '—'}</TableCell>
                <TableCell style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, border:'1px solid #334155', borderRadius:6 }} title="PC">
                    <Monitor size={16} />
                  </span>
                  <span>{a.pc_nombre || '-'}</span>
                </TableCell>
                <TableCell>{(a.fecha_hora || '').slice(0,10)}</TableCell>
                <TableCell><code>{a.clave_amarilla || ''}</code></TableCell>
                <TableCell>
                  <div style={{display:'flex', gap:6}}>
                    <Button size="sm" variant="secondary" onClick={()=> copyToClipboard(a.clave_amarilla||'', toast)} title="Copiar clave">
                      <ClipboardCopy size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          })()}
        </TableBody>
      </Table>
      {/* Paginación simple */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, marginTop:12 }}>
        <Button size="sm" variant="outline" onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1}>Anterior</Button>
        <Button size="sm" variant="outline" onClick={()=> setPage(p=> p+1)}>Siguiente</Button>
      </div>
    </div>
  )
}