/**
 * @file hosting-plans.js
 * @description CRUD routes for HostingPlan catalog — MASTER only
 * @module Backend Route
 * @path /backend/src/routes/hosting-plans.js
 * @lastUpdated 2026-03-20
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// LIST all hosting plans
router.get('/', authRequired, async (req, res) => {
  try {
    const plans = await prisma.hostingPlan.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { licenses: true } }
      }
    })
    res.json(plans)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET one
router.get('/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const plan = await prisma.hostingPlan.findUnique({
      where: { id },
      include: { _count: { select: { licenses: true } } }
    })
    if (!plan) return res.status(404).json({ error: 'Hosting plan not found' })
    res.json(plan)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// CREATE (MASTER only)
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const { name, abbreviation, concurrentQuestionnaires, isActive } = req.body
    if (!name || !abbreviation) return res.status(400).json({ error: 'name and abbreviation are required' })

    const plan = await prisma.hostingPlan.create({
      data: {
        name,
        abbreviation: abbreviation.toUpperCase(),
        concurrentQuestionnaires: Number(concurrentQuestionnaires || 2),
        isActive: isActive !== false
      }
    })

    logAction({
      req,
      action: 'CREATE',
      entity: 'HostingPlan',
      entityId: String(plan.id),
      details: `Hosting plan creado: ${plan.name} (${plan.abbreviation})`
    })

    res.status(201).json(plan)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Abbreviation already exists' })
    res.status(400).json({ error: e.message })
  }
})

// UPDATE (MASTER only)
router.put('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, abbreviation, concurrentQuestionnaires, isActive } = req.body
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation.toUpperCase()
    if (concurrentQuestionnaires !== undefined) updateData.concurrentQuestionnaires = Number(concurrentQuestionnaires)
    if (isActive !== undefined) updateData.isActive = isActive

    const plan = await prisma.hostingPlan.update({
      where: { id },
      data: updateData
    })

    logAction({
      req,
      action: 'UPDATE',
      entity: 'HostingPlan',
      entityId: String(plan.id),
      details: `Hosting plan actualizado: ${plan.name}`
    })

    res.json(plan)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Abbreviation already exists' })
    res.status(400).json({ error: e.message })
  }
})

// DELETE (MASTER only — only if no licenses use it)
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const count = await prisma.license.count({ where: { hostingPlanId: id } })
    if (count > 0) return res.status(409).json({ error: `Cannot delete: ${count} licenses use this plan` })

    await prisma.hostingPlan.delete({ where: { id } })
    logAction({
      req,
      action: 'DELETE',
      entity: 'HostingPlan',
      entityId: String(id),
      details: 'Hosting plan eliminado'
    })

    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
