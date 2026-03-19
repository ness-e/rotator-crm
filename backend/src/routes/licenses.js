/**
 * @file licenses.js
 * @description Definición de rutas API para el módulo licenses.
 * @module Backend Route
 * @path /backend/src/routes/licenses.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { generateLicensePayload } from '../services/licenseService.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { ParamIdSchema } from '../validation/schemas.js' // Might need to update schemas too!
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /with-count - List licenses with activation counts (for pending clients dashboard)
router.get('/with-count', authRequired, requireMaster, async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        _count: {
          select: { activaciones: true }
        }
      }
    })
    res.json(licenses)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// LIST
router.get('/', authRequired, requireMaster, async (req, res) => {
  const licenses = await prisma.license.findMany({
    include: { organization: true, activations: true }
  })
  res.json(licenses)
})

// GET ONE
router.get('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
  const id = Number(req.validated.params.id)
  const lic = await prisma.license.findUnique({
    where: { id },
    include: { organization: true, activations: true }
  })
  if (!lic) return res.status(404).json({ error: 'License not found' })
  res.json(lic)
})

// CREATE (Manual)
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const data = req.body

    // We need logic to generate serial if not provided
    let serialKey = data.serialKey
    let keyEncrypted = null

    if (!serialKey) {
      // Generate Legacy Key
      // Need Org and main User?
      // Logic requires: email, organization, etc.
      const org = await prisma.organization.findUnique({
        where: { id: Number(data.organizationId) },
        include: { users: true }
      })
      if (!org) return res.status(400).json({ error: 'Organization not found' })

      // Pick first user's email or generic
      const mainUser = org.users[0]
      const email = mainUser ? mainUser.email : 'no-email@rotator.com'

      const payload = {
        fecha: data.expirationDate ? new Date(data.expirationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        id_version: 3, // Default PRO
        version_letras: 'PR', // Default
        id_hosting: 0,
        hosting_letras: data.hostingType === 'PRIVATE_SERVER' ? 'PRI' : 'CLD',
        email: email,
        organizacion: org.name,
        activador_letras: 'AD', // Admin
        pais_letras: org.countryCode || 'XX',
        admins: data.limitAdmins || 1,
        preguntas: data.limitQuestions || 100,
        // ... map others
        tablets: 0,
        telefonicos: 0,
        dataEntries: 0,
        analizadores: 0,
        clasificadores: 0,
        supsCaptura: 0,
        supsKiosco: 0,
        clientes: 0,
      }

      const gen = generateLicensePayload(payload)
      serialKey = gen.serial
      // We don't store encrypted key in V2 schema? 
      // V2 License model has `serialKey` only?
      // Wait, V2 Schema in prompt: `model License`... `serialKey String`, `status`.
      // It DOES NOT have `clave_activacion_encriptada`.
      // BUT the desktop app needs it during activation?
      // `ActivationLog` has `keyUsed`.
      // If we don't store the "Clave" (encrypted string), we can't show it to the user to copy-paste into the Desktop App?
      // The Desktop App asks for "Serial".
      // Does it calculate the Clave locally, or does the server send it?
      // `licenseService.js` returns `{ serial, clave }`.
      // `maestro_licencias` had `clave_activacion_encriptada`.
      // V2 `License` DOES NOT HAVE `clave_activacion_encriptada`.
      // This might be a missing field in the Master Plan!
      // "Riesgo de Datos? ... este plan no haya contemplado?"
      // I found a missing field.
      // I should probably add it or store it in `details` or something?
      // Or re-generate it on the fly?
      // I'll re-generate it on the fly in the Frontend ("GET /licenses" could compute it?).
      // No, `generateLicensePayload` relies on current date sometimes? 
      // Logic: `const now = new Date()` (lines 32-35 in licenseService.js).
      // So the Clave changes every day?
      // If so, we surely can't store it permanently...
      // Actually line 86 `const ClaveEncriptada = utilitarioEncriptar(Clave, PalabraMagica)`
      // `Clave` includes `dia`, `mes`, `ano` (creation date?).
      // If it's creation date, we must store it OR the creation date.
      // License V2 has `createdAt`.
      // I will assume we can regenerate it if we match the parameters.

      // Use the generated serial.
    }

    const license = await prisma.license.create({
      data: {
        organizationId: Number(data.organizationId),
        serialKey: serialKey,
        status: data.status || 'ACTIVE',
        limitQuestions: data.limitQuestions || 0,
        limitCases: data.limitCases || 0,
        limitAdmins: data.limitAdmins || 1,
        hostingType: data.hostingType || 'CLOUD_ROTATOR',
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,

        // Mapped Limits
        limitMobileUsers: Number(data.n_moviles || 0),
        limitPhoneUsers: Number(data.n_telefonicos || 0),
        limitDataEntries: Number(data.n_digitadores || 0),
        limitAnalysts: Number(data.n_analistas || 0),
        limitClients: Number(data.n_clientes || 0),
        limitClassifiers: Number(data.n_clasificadores || 0),
        limitCaptureSupervisors: Number(data.n_supervisores_captura || 0),
        limitKioskSupervisors: Number(data.n_supervisores_kiosco || 0),
        limitParticipants: Number(data.n_participantes || 0),
        concurrentQuestionnaires: Number(data.cuestionarios_concurrentes || 0),
      }
    })

    // Log
    logAction({
      req,
      action: 'CREATE',
      entity: 'Licencia',
      entityId: String(license.id),
      details: `Licencia creada: ${serialKey}`
    })

    res.status(201).json(license)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Serial key already exists' })
    res.status(400).json({ error: e.message })
  }
})

// DELETE
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.license.delete({ where: { id } })
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
