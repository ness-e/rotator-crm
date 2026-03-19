/**
 * @file licenciasEnActivacion.js
 * @description Definición de rutas API para el módulo licenciasEnActivacion.
 * @module Backend Route
 * @path /backend/src/routes/licenciasEnActivacion.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /pending-licenses
router.get('/', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.licenciaEnActivacion.findMany({ orderBy: { id: 'asc' } })
  res.json(rows)
})

// POST /pending-licenses
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const created = await prisma.licenciaEnActivacion.create({
      data: {
        id: String(req.body.id),
        codigo_licencia: String(req.body.codigo_licencia || ''),
        correo_paypal: String(req.body.correo_paypal || ''),
      }
    })
    logAction({ req, action: 'CREATE', entity: 'LicenciaEnActivacion', entityId: created.id, entityName: created.codigo_licencia, details: `Licencia pendiente creada: ${created.codigo_licencia}` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// PUT /pending-licenses/:id
router.put('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = String(req.params.id)
    const updated = await prisma.licenciaEnActivacion.update({
      where: { id }, data: {
        codigo_licencia: req.body.codigo_licencia ?? undefined,
        correo_paypal: req.body.correo_paypal ?? undefined,
      }
    })
    logAction({ req, action: 'UPDATE', entity: 'LicenciaEnActivacion', entityId: id, entityName: updated.codigo_licencia, details: 'Licencia pendiente actualizada' })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /pending-licenses/:id
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = String(req.params.id)
    await prisma.licenciaEnActivacion.delete({ where: { id } })
    logAction({ req, action: 'DELETE', entity: 'LicenciaEnActivacion', entityId: id, entityName: `ID ${id}`, details: 'Licencia pendiente eliminada' })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

export default router
