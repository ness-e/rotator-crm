/**
 * @file catalog.js
 * @description Definición de rutas API para el módulo catalog.
 * @module Backend Route
 * @path /backend/src/routes/catalog.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /catalog/activadores - Returns users with MASTER or ANALISTA roles
router.get('/activadores', authRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['MASTER', 'ANALISTA'] },
        isActive: true
      },
      orderBy: { firstName: 'asc' }
    })
    
    // Map to legacy format expected by components like FollowUpCalendar
    const rows = users.map(u => ({
      id_activador: u.id,
      nombre_activador: `${u.firstName} ${u.lastName}`.trim(),
      abreviatura: u.firstName.substring(0, 3).toUpperCase()
    }))
    
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /catalog/masters - Returns clean user objects with MASTER role
router.get('/masters', authRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'MASTER',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: { firstName: 'asc' }
    })
    res.json(users)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST/PUT/DELETE for activadores are now deprecated as they are managed via Users
// But we keep empty or redirect logic if needed. For now, we allow reading only.

// GET /catalog/hosting
router.get('/hosting', authRequired, async (req, res) => {
  try {
    const plans = await prisma.hostingPlan.findMany({ orderBy: { id: 'asc' } })
    // Map to legacy format
    const rows = plans.map(p => ({
      id_hosting: p.id,
      version_hosting: p.name,
      letras_hosting: p.abbreviation,
      cuestionarios_c: p.concurrentQuestionnaires
    }))
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST/PUT/DELETE for hosting are now managed via /hosting-plans route
// but we could keep them here as aliases if needed. 
// For now, we prefer /hosting-plans for CRUD.

// GET /catalog/license-versions — uses ProductTemplate model (formerly LicenseVersion)
router.get('/license-versions', authRequired, requireMaster, async (req, res) => {
  try {
    const templates = await prisma.productTemplate.findMany({
      orderBy: { id: 'asc' },
      include: { defaultHostingPlan: true }
    })
    // Map to legacy field names expected by AdminPlans frontend
    const rows = templates.map(t => ({
      id_version: t.versionId ?? t.id,
      version_nombre: t.name,
      version_letra: t.abbreviation || t.code,
      n_preguntas: t.defaultQuestions,
      n_casos: t.defaultCases,
      n_admins: t.defaultAdmins,
      n_moviles: t.defaultMobileUsers,
      n_telefonicos: t.defaultPhoneUsers,
      n_digitadores: t.defaultDataEntries,
      n_analistas: t.defaultAnalysts,
      n_clientes: t.defaultClients,
      n_clasificadores: t.defaultClassifiers,
      n_supervisores_captura: t.defaultCaptureSupervisors,
      n_supervisores_kiosco: t.defaultKioskSupervisors,
      n_participantes: t.defaultParticipants,
      hosting: t.defaultHostingPlanId,
      servidor: t.defaultServerType,
      cuestionarios_concurrentes: t.concurrentQuestionnaires,
      price_monthly: Number(t.basePrice) || 0,
      price_annual: Number(t.basePrice) * 10 || 0,
      price_currency: t.currency,
      // Keep original fields available
      _templateId: t.id,
      _code: t.code,
      _category: t.category,
      _isActive: t.isActive,
    }))
    res.json(rows)
  } catch (e) {
    console.error('license-versions error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// POST /catalog/license-versions
router.post('/license-versions', authRequired, requireMaster, async (req, res) => {
  try {
    const created = await prisma.productTemplate.create({
      data: {
        name: req.body.version_nombre,
        code: req.body.version_letra,
        category: 'STANDARD',
        abbreviation: req.body.version_letra,
        defaultQuestions: Number(req.body.n_preguntas || 0),
        defaultCases: Number(req.body.n_casos || 0),
        defaultAdmins: Number(req.body.n_admins || 1),
        defaultMobileUsers: Number(req.body.n_moviles || 0),
        defaultPhoneUsers: Number(req.body.n_telefonicos || 0),
        defaultDataEntries: Number(req.body.n_digitadores || 0),
        defaultAnalysts: Number(req.body.n_analistas || 0),
        defaultClients: Number(req.body.n_clientes || 0),
        defaultClassifiers: Number(req.body.n_clasificadores || 0),
        defaultCaptureSupervisors: Number(req.body.n_supervisores_captura || 0),
        defaultKioskSupervisors: Number(req.body.n_supervisores_kiosco || 0),
        defaultParticipants: Number(req.body.n_participantes || 0),
        defaultHostingPlanId: req.body.hosting ? Number(req.body.hosting) : null,
        defaultServerType: req.body.servidor ? Number(req.body.servidor) : 0,
        concurrentQuestionnaires: Number(req.body.cuestionarios_concurrentes || 0),
        basePrice: Number(req.body.price_monthly || 0),
        currency: req.body.price_currency || 'USD'
      }
    })
    
    logAction({ req, action: 'CREATE', entity: 'ProductTemplate', entityId: created.id, entityName: created.name, details: `Versión de Licencia creada: ${created.name}` })
    res.json({ ...created, id_version: created.id })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

router.put('/license-versions/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const updated = await prisma.productTemplate.update({
      where: { id },
      data: {
        name: req.body.version_nombre,
        code: req.body.version_letra,
        defaultQuestions: Number(req.body.n_preguntas),
        defaultCases: Number(req.body.n_casos),
        defaultAdmins: Number(req.body.n_admins),
        defaultMobileUsers: Number(req.body.n_moviles),
        defaultPhoneUsers: Number(req.body.n_telefonicos),
        defaultDataEntries: Number(req.body.n_digitadores),
        defaultAnalysts: Number(req.body.n_analistas),
        defaultClients: Number(req.body.n_clientes),
        defaultClassifiers: Number(req.body.n_clasificadores),
        defaultCaptureSupervisors: Number(req.body.n_supervisores_captura),
        defaultKioskSupervisors: Number(req.body.n_supervisores_kiosco),
        defaultParticipants: Number(req.body.n_participantes),
        defaultHostingPlanId: req.body.hosting ? Number(req.body.hosting) : null,
        defaultServerType: req.body.servidor ? Number(req.body.servidor) : 0,
        concurrentQuestionnaires: Number(req.body.cuestionarios_concurrentes),
        basePrice: Number(req.body.price_monthly),
        currency: req.body.price_currency
      }
    })

    logAction({ req, action: 'UPDATE', entity: 'ProductTemplate', entityId: id, entityName: updated.name, details: `Versión de Licencia actualizada: ${updated.name}` })
    res.json({ ...updated, id_version: updated.id })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /catalog/license-versions/:id
router.delete('/license-versions/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.productTemplate.delete({ where: { id } })
    logAction({ req, action: 'DELETE', entity: 'ProductTemplate', entityId: id, entityName: `ID ${id}`, details: 'Versión de Licencia eliminada' })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// GET /catalog/market-targets
router.get('/market-targets', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.marketTarget.findMany({ orderBy: { id: 'asc' } })
  res.json(rows)
})

// POST /catalog/market-targets
router.post('/market-targets', authRequired, requireMaster, async (req, res) => {
  try {
    const created = await prisma.marketTarget.create({
      data: {
        name: req.body.name,
        abbreviation: req.body.abbreviation,
      }
    })
    logAction({ req, action: 'CREATE', entity: 'MarketTarget', entityId: created.id, entityName: created.name, details: `Target creado: ${created.name}` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// PUT /catalog/market-targets/:id
router.put('/market-targets/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const old = await prisma.marketTarget.findUnique({ where: { id } })
    if (!old) return res.status(404).json({ error: 'Target no encontrado' })

    const updated = await prisma.marketTarget.update({
      where: { id },
      data: {
        name: req.body.name ?? undefined,
        abbreviation: req.body.abbreviation ?? undefined,
      }
    })

    logAction({ req, action: 'UPDATE', entity: 'MarketTarget', entityId: id, entityName: updated.name, details: `Target actualizado` })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /catalog/market-targets/:id
router.delete('/market-targets/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.marketTarget.delete({ where: { id } })
    logAction({ req, action: 'DELETE', entity: 'MarketTarget', entityId: id, entityName: `ID ${id}`, details: 'Target eliminado' })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// GET /catalog/server-types - Static list for now as it's missing from DB
router.get('/server-types', authRequired, async (req, res) => {
  res.json([
    { id: 1, label: 'Cloud shared', value: 'CLOUD_SHARED', description: 'Shared infrastructure' },
    { id: 2, label: 'Cloud VPS', value: 'CLOUD_VPS', description: 'Virtual Private Server' },
    { id: 3, label: 'On-Premise', value: 'ON_PREMISE', description: 'Customer hardware' },
    { id: 4, label: 'Dedicated', value: 'DEDICATED', description: 'Dedicated physical server' }
  ])
})

// GET /catalog/pipeline-stages
router.get('/pipeline-stages', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.pipelineStage.findMany({ orderBy: { orderIndex: 'asc' } })
  res.json(rows)
})

// POST /catalog/pipeline-stages
router.post('/pipeline-stages', authRequired, requireMaster, async (req, res) => {
  try {
    const created = await prisma.pipelineStage.create({
      data: {
        label: req.body.label,
        value: req.body.value,
        color: req.body.color,
        orderIndex: Number(req.body.order || 0),
      }
    })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /catalog/pipeline-stages/:id
router.put('/pipeline-stages/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.pipelineStage.update({
      where: { id },
      data: {
        label: req.body.label ?? undefined,
        value: req.body.value ?? undefined,
        color: req.body.color ?? undefined,
        orderIndex: req.body.order != null ? Number(req.body.order) : undefined,
      }
    })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// DELETE /catalog/pipeline-stages/:id
router.delete('/pipeline-stages/:id', authRequired, requireMaster, async (req, res) => {
  try {
    await prisma.pipelineStage.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
