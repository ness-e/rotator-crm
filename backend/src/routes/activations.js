/**
 * @file activations.js
 * @description Definición de rutas API para el módulo activations (ActivationLog).
 * @module Backend Route
 * @path /backend/src/routes/activations.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /activations
router.get('/', authRequired, requireMaster, async (req, res) => {
  try {
    const rows = await prisma.activationLog.findMany({
      orderBy: { id: 'asc' },
      include: {
        license: {
          select: { serialKey: true, organization: { select: { name: true } } }
        }
      }
    })
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /activations (Manual Creation)
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const data = req.body

    // Map legacy/frontend fields to Schema
    const licenseId = Number(data.id_licencia || data.licenseId)
    const pcName = String(data.pc_nombre || data.pcName || '')
    const keyUsed = String(data.clave_amarilla || data.keyUsed || '')
    const date = data.fecha_hora ? new Date(data.fecha_hora) : new Date()

    if (!licenseId) return res.status(400).json({ error: 'License ID is required' })

    const created = await prisma.activationLog.create({
      data: {
        licenseId,
        pcName,
        keyUsed,
        date,
        ipAddress: req.ip // Audit IP
      }
    })

    logAction({
      req,
      action: 'CREATE',
      entity: 'ActivationLog',
      entityId: created.id,
      entityName: created.pcName,
      details: `Activación manual creada. PC: ${created.pcName}, Clave: ${created.keyUsed}`
    })

    res.json(created)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message || 'Bad request' })
  }
})

// PUT /activations/:id
router.put('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const data = req.body

    const updateData = {}
    if (data.id_licencia || data.licenseId) updateData.licenseId = Number(data.id_licencia || data.licenseId)
    if (data.pc_nombre !== undefined) updateData.pcName = data.pc_nombre
    if (data.pcName !== undefined) updateData.pcName = data.pcName
    if (data.clave_amarilla !== undefined) updateData.keyUsed = data.clave_amarilla
    if (data.keyUsed !== undefined) updateData.keyUsed = data.keyUsed
    if (data.fecha_hora) updateData.date = new Date(data.fecha_hora)

    const updated = await prisma.activationLog.update({
      where: { id },
      data: updateData
    })

    logAction({
      req,
      action: 'UPDATE',
      entity: 'ActivationLog',
      entityId: id,
      entityName: updated.pcName,
      details: 'Activación manual actualizada'
    })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /activations/:id
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.activationLog.delete({ where: { id } })

    logAction({
      req,
      action: 'DELETE',
      entity: 'ActivationLog',
      entityId: id,
      entityName: `ID ${id}`,
      details: 'Activación manual eliminada'
    })

    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

export default router
