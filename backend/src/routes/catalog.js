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

// GET /catalog/activadores
router.get('/activadores', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.activador.findMany({ orderBy: { id_activador: 'asc' } })
  res.json(rows)
})

// POST /catalog/activadores
router.post('/activadores', authRequired, requireMaster, async (req, res) => {
  try {
    // Si no se proporciona id_activador, obtener el máximo y sumar 1
    let id_activador = Number(req.body.id_activador)
    if (!id_activador || isNaN(id_activador)) {
      const maxActivador = await prisma.activador.findFirst({
        orderBy: { id_activador: 'desc' }
      })
      id_activador = maxActivador ? maxActivador.id_activador + 1 : 1
    }

    const created = await prisma.activador.create({
      data: {
        id_activador,
        nombre_activador: req.body.nombre_activador || null,
        abreviatura: req.body.abreviatura || null,
      }
    })
    logAction({ req, action: 'CREATE', entity: 'Activador', entityId: created.id_activador, entityName: created.nombre_activador, details: `Activador creado: ${created.nombre_activador} (${created.abreviatura})` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

router.put('/activadores/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const old = await prisma.activador.findUnique({ where: { id_activador: id } })
    if (!old) return res.status(404).json({ error: 'Activador no encontrado' })

    const updated = await prisma.activador.update({
      where: { id_activador: id }, data: {
        nombre_activador: req.body.nombre_activador ?? undefined,
        abreviatura: req.body.abreviatura ?? undefined,
      }
    })

    const changes = []
    if (req.body.nombre_activador !== undefined && old.nombre_activador !== req.body.nombre_activador)
      changes.push(`Nombre: "${old.nombre_activador}" -> "${req.body.nombre_activador}"`)
    if (req.body.abreviatura !== undefined && old.abreviatura !== req.body.abreviatura)
      changes.push(`Abrev: "${old.abreviatura}" -> "${req.body.abreviatura}"`)

    logAction({
      req,
      action: 'UPDATE',
      entity: 'Activador',
      entityId: id,
      entityName: updated.nombre_activador,
      details: changes.length > 0 ? `Modificado: ${changes.join(', ')}` : 'Actualizado sin cambios'
    })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /catalog/activadores/:id
router.delete('/activadores/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.activador.delete({ where: { id_activador: id } })
    logAction({ req, action: 'DELETE', entity: 'Activador', entityId: id, entityName: `ID ${id}`, details: 'Activador eliminado' })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// GET /catalog/hosting
router.get('/hosting', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.hosting.findMany({ orderBy: { id_hosting: 'asc' } })
  res.json(rows)
})

// POST /catalog/hosting
router.post('/hosting', authRequired, requireMaster, async (req, res) => {
  try {
    // Si no se proporciona id_hosting, obtener el máximo y sumar 1
    let id_hosting = Number(req.body.id_hosting)
    if (!id_hosting || isNaN(id_hosting)) {
      const maxHosting = await prisma.hosting.findFirst({
        orderBy: { id_hosting: 'desc' }
      })
      id_hosting = maxHosting ? maxHosting.id_hosting + 1 : 1
    }

    const created = await prisma.hosting.create({
      data: {
        id_hosting,
        version_hosting: req.body.version_hosting || null,
        letras_hosting: req.body.letras_hosting || null,
        cuestionarios_c: req.body.cuestionarios_c != null ? Number(req.body.cuestionarios_c) : null,
      }
    })
    logAction({ req, action: 'CREATE', entity: 'HostingPlan', entityId: created.id_hosting, entityName: created.version_hosting, details: `Plan de Hosting creado: ${created.version_hosting} (${created.letras_hosting})` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

router.put('/hosting/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const old = await prisma.hosting.findUnique({ where: { id_hosting: id } })
    if (!old) return res.status(404).json({ error: 'Plan de hosting no encontrado' })

    const updated = await prisma.hosting.update({
      where: { id_hosting: id }, data: {
        version_hosting: req.body.version_hosting ?? undefined,
        letras_hosting: req.body.letras_hosting ?? undefined,
        cuestionarios_c: req.body.cuestionarios_c != null ? Number(req.body.cuestionarios_c) : undefined,
      }
    })

    const changes = []
    if (req.body.version_hosting !== undefined && old.version_hosting !== req.body.version_hosting)
      changes.push(`Versión: "${old.version_hosting}" -> "${req.body.version_hosting}"`)
    if (req.body.letras_hosting !== undefined && old.letras_hosting !== req.body.letras_hosting)
      changes.push(`Letras: "${old.letras_hosting}" -> "${req.body.letras_hosting}"`)
    if (req.body.cuestionarios_c !== undefined && old.cuestionarios_c !== Number(req.body.cuestionarios_c))
      changes.push(`Cuestionarios: "${old.cuestionarios_c}" -> "${req.body.cuestionarios_c}"`)

    logAction({
      req,
      action: 'UPDATE',
      entity: 'Hosting',
      entityId: id,
      entityName: updated.version_hosting,
      details: changes.length > 0 ? `Modificado: ${changes.join(', ')}` : 'Actualizado sin cambios'
    })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /catalog/hosting/:id
router.delete('/hosting/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.hosting.delete({ where: { id_hosting: id } })
    logAction({ req, action: 'DELETE', entity: 'HostingPlan', entityId: id, entityName: `ID ${id}`, details: 'Plan de Hosting eliminado' })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// GET /catalog/license-versions
router.get('/license-versions', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.licenseVersion.findMany({ orderBy: { id_version: 'asc' } })
  res.json(rows)
})

// POST /catalog/license-versions
router.post('/license-versions', authRequired, requireMaster, async (req, res) => {
  try {
    // Si no se proporciona id_version, obtener el máximo y sumar 1
    let id_version = Number(req.body.id_version)
    if (!id_version || isNaN(id_version)) {
      const maxVersion = await prisma.licenseVersion.findFirst({
        orderBy: { id_version: 'desc' }
      })
      id_version = maxVersion ? maxVersion.id_version + 1 : 1
    }

    const data = {
      id_version,
      version_nombre: req.body.version_nombre || null,
      version_letra: req.body.version_letra || null,
      n_preguntas: req.body.n_preguntas != null ? Number(req.body.n_preguntas) : null,
      n_casos: req.body.n_casos != null ? Number(req.body.n_casos) : null,
      n_admins: req.body.n_admins != null ? Number(req.body.n_admins) : null,
      n_moviles: req.body.n_moviles != null ? Number(req.body.n_moviles) : null,
      n_telefonicos: req.body.n_telefonicos != null ? Number(req.body.n_telefonicos) : null,
      n_digitadores: req.body.n_digitadores != null ? Number(req.body.n_digitadores) : null,
      n_analistas: req.body.n_analistas != null ? Number(req.body.n_analistas) : null,
      n_clientes: req.body.n_clientes != null ? Number(req.body.n_clientes) : null,
      n_clasificadores: req.body.n_clasificadores != null ? Number(req.body.n_clasificadores) : null,
      n_supervisores_captura: req.body.n_supervisores_captura != null ? Number(req.body.n_supervisores_captura) : null,
      n_supervisores_kiosco: req.body.n_supervisores_kiosco != null ? Number(req.body.n_supervisores_kiosco) : null,
      n_participantes: req.body.n_participantes != null ? Number(req.body.n_participantes) : null,
      hosting: req.body.hosting != null ? Number(req.body.hosting) : null,
      servidor: req.body.servidor != null ? Number(req.body.servidor) : null,
      cuestionarios_concurrentes: req.body.cuestionarios_concurrentes != null ? Number(req.body.cuestionarios_concurrentes) : null,
    }
    const created = await prisma.licenseVersion.create({ data })
    logAction({ req, action: 'CREATE', entity: 'LicenseVersion', entityId: created.id_version, entityName: created.version_nombre, details: `Versión de Licencia creada: ${created.version_nombre}` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

router.put('/license-versions/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const old = await prisma.licenseVersion.findUnique({ where: { id_version: id } })
    if (!old) return res.status(404).json({ error: 'Versión de licencia no encontrada' })

    const data = {
      version_nombre: req.body.version_nombre ?? undefined,
      version_letra: req.body.version_letra ?? undefined,
      n_preguntas: req.body.n_preguntas != null ? Number(req.body.n_preguntas) : undefined,
      n_casos: req.body.n_casos != null ? Number(req.body.n_casos) : undefined,
      n_admins: req.body.n_admins != null ? Number(req.body.n_admins) : undefined,
      n_moviles: req.body.n_moviles != null ? Number(req.body.n_moviles) : undefined,
      n_telefonicos: req.body.n_telefonicos != null ? Number(req.body.n_telefonicos) : undefined,
      n_digitadores: req.body.n_digitadores != null ? Number(req.body.n_digitadores) : undefined,
      n_analistas: req.body.n_analistas != null ? Number(req.body.n_analistas) : undefined,
      n_clientes: req.body.n_clientes != null ? Number(req.body.n_clientes) : undefined,
      n_clasificadores: req.body.n_clasificadores != null ? Number(req.body.n_clasificadores) : undefined,
      n_supervisores_captura: req.body.n_supervisores_captura != null ? Number(req.body.n_supervisores_captura) : undefined,
      n_supervisores_kiosco: req.body.n_supervisores_kiosco != null ? Number(req.body.n_supervisores_kiosco) : undefined,
      n_participantes: req.body.n_participantes != null ? Number(req.body.n_participantes) : undefined,
      hosting: req.body.hosting != null ? Number(req.body.hosting) : undefined,
      servidor: req.body.servidor != null ? Number(req.body.servidor) : undefined,
      cuestionarios_concurrentes: req.body.cuestionarios_concurrentes != null ? Number(req.body.cuestionarios_concurrentes) : undefined,
    }
    const updated = await prisma.licenseVersion.update({ where: { id_version: id }, data })

    const changes = []
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined) return
      const val = old[key]
      const newVal = req.body[key]
      if (val != newVal) changes.push(`${key}: "${val}" -> "${newVal}"`)
    })

    logAction({
      req,
      action: 'UPDATE',
      entity: 'Versión',
      entityId: id,
      entityName: updated.version_nombre,
      details: changes.length > 0 ? `Modificado: ${changes.join(', ')}` : 'Actualizado sin cambios'
    })
    res.json(updated)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// DELETE /catalog/license-versions/:id
router.delete('/license-versions/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.licenseVersion.delete({ where: { id_version: id } })
    logAction({ req, action: 'DELETE', entity: 'LicenseVersion', entityId: id, entityName: `ID ${id}`, details: 'Versión de Licencia eliminada' })
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

// GET /catalog/server-types
router.get('/server-types', authRequired, requireMaster, async (req, res) => {
  const rows = await prisma.serverType.findMany({ orderBy: { id: 'asc' } })
  res.json(rows)
})

// POST /catalog/server-types
router.post('/server-types', authRequired, requireMaster, async (req, res) => {
  try {
    const created = await prisma.serverType.create({
      data: {
        label: req.body.label,
        value: req.body.value,
        description: req.body.description,
      }
    })
    logAction({ req, action: 'CREATE', entity: 'ServerType', entityId: created.id, entityName: created.label, details: `Tipo Servidor creado` })
    res.json(created)
  } catch (e) { res.status(400).json({ error: e.message || 'Bad request' }) }
})

// PUT /catalog/server-types/:id
router.put('/server-types/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.serverType.update({
      where: { id },
      data: {
        label: req.body.label ?? undefined,
        value: req.body.value ?? undefined,
        description: req.body.description ?? undefined,
      }
    })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// DELETE /catalog/server-types/:id
router.delete('/server-types/:id', authRequired, requireMaster, async (req, res) => {
  try {
    await prisma.serverType.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
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
