/**
 * @file activations.js
 * @description API routes for ActivationLog — supports hardwareId, individual delete, and kill-all.
 * @module Backend Route
 * @path /backend/src/routes/activations.js
 * @lastUpdated 2026-03-20
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// ─────────────────────────────────────────────────────────
// LIST all activations (MASTER only)
// ─────────────────────────────────────────────────────────
router.get('/', authRequired, requireMaster, async (req, res) => {
  try {
    const rows = await prisma.activationLog.findMany({
      orderBy: { date: 'desc' },
      include: {
        license: {
          select: {
            serialKey: true,
            friendlyName: true,
            organization: { select: { id: true, name: true } }
          }
        }
      }
    })
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// GET activations by license ID
// ─────────────────────────────────────────────────────────
router.get('/by-license/:licenseId', authRequired, async (req, res) => {
  try {
    const licenseId = Number(req.params.licenseId)
    const rows = await prisma.activationLog.findMany({
      where: { licenseId },
      orderBy: { date: 'desc' }
    })
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// POST create activation (desktop client or manual)
// Now includes hardwareId field and @@unique check
// ─────────────────────────────────────────────────────────
router.post('/', authRequired, async (req, res) => {
  try {
    const data = req.body

    const licenseId = Number(data.licenseId || data.id_licencia)
    const pcName = String(data.pcName || data.pc_nombre || '')
    const keyUsed = String(data.keyUsed || data.clave_amarilla || '')
    const hardwareId = String(data.hardwareId || data.clave_amarilla || '')
    const date = data.date ? new Date(data.date) : new Date()

    if (!licenseId) return res.status(400).json({ error: 'License ID is required' })

    // Create activation — @@unique(licenseId, hardwareId, pcName) will prevent duplicates
    const created = await prisma.activationLog.create({
      data: {
        licenseId,
        pcName,
        keyUsed,
        hardwareId: hardwareId || null,
        date,
        ipAddress: req.ip
      }
    })

    logAction({
      req,
      action: 'CREATE',
      entity: 'ActivationLog',
      entityId: String(created.id),
      details: `Activación creada: PC=${pcName}, HW=${hardwareId}, License=${licenseId}`
    })

    res.status(201).json(created)
  } catch (e) {
    // P2002 = unique constraint violation
    if (e.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate activation: this hardware + PC already activated for this license',
        code: 'DUPLICATE_ACTIVATION'
      })
    }
    console.error('Activation creation error:', e)
    res.status(400).json({ error: e.message || 'Bad request' })
  }
})

// ─────────────────────────────────────────────────────────
// DELETE single activation (MASTER only — individual deactivation)
// ─────────────────────────────────────────────────────────
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const activation = await prisma.activationLog.findUnique({ where: { id } })
    if (!activation) return res.status(404).json({ error: 'Activation not found' })

    await prisma.activationLog.delete({ where: { id } })

    logAction({
      req,
      action: 'DELETE',
      entity: 'ActivationLog',
      entityId: String(id),
      details: `Activación eliminada: PC=${activation.pcName}, HW=${activation.hardwareId}`
    })

    res.json({ ok: true, deleted: activation })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Bad request' })
  }
})

export default router
