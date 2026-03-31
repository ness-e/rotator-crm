/**
 * @file licenses.js
 * @description API routes for the License module — integrates serial generation and XOR encryption.
 * @module Backend Route
 * @path /backend/src/routes/licenses.js
 * @lastUpdated 2026-03-20
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'
import { generateSerial } from '../services/licenseSerial.js'
import { generateEncryptedActivationKey } from '../services/licenseEncryption.js'

const router = Router()

// ─────────────────────────────────────────────────────────
// LIST all licenses (MASTER only)
// ─────────────────────────────────────────────────────────
router.get('/', authRequired, requireMaster, async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        organization: true,
        activations: true,
        hostingPlan: true,
        licenseServers: {
          include: { server: true }
        },
        productTemplate: true,
        activatedBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })
    res.json(licenses)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// GET licenses with activation counts (Legacy structure for PendingClients)
// ─────────────────────────────────────────────────────────
router.get('/with-count', authRequired, requireMaster, async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        organization: { include: { users: true } },
        productTemplate: true,
        activatedBy: true,
        _count: { select: { activations: true } }
      }
    })
    
    const mapped = licenses.map(l => ({
      ...l,
      id_licencia: l.id,
      id_cliente: l.organizationId,
      licencia_serial: l.serialKey,
      licencia_expira: l.expirationDate ? l.expirationDate.toISOString().split('T')[0] : 'N/A',
      licencia_tipo: l.productTemplate?.name || '-',
      licencia_activador: l.activatedBy ? `${l.activatedBy.firstName || ''} ${l.activatedBy.lastName || ''}`.trim() : '-',
      correo_cliente: l.organization?.users?.[0]?.email || l.organization?.email || '-',
      organizacion_cliente: l.organization?.name || '-',
      pais_cliente: l.organization?.countryCode || '-',
      ciudad_cliente: l.organization?.city || '-',
      _count: { activaciones: l._count?.activations || 0 }
    }))
    res.json(mapped)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// GET ONE license by ID (MASTER only)
// ─────────────────────────────────────────────────────────
router.get('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const lic = await prisma.license.findUnique({
      where: { id },
      include: {
        organization: true,
        activations: true,
        hostingPlan: true,
        licenseServers: {
          include: { server: true }
        },
        productTemplate: true,
        activatedBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })
    if (!lic) return res.status(404).json({ error: 'License not found' })
    res.json(lic)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// CREATE a license (MASTER only)
// Auto-generates serial and encrypted activation key
// ─────────────────────────────────────────────────────────
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const data = req.body

    // 1. Get org info for serial generation
    const org = await prisma.organization.findUnique({
      where: { id: Number(data.organizationId) },
      include: { users: true }
    })
    if (!org) return res.status(400).json({ error: 'Organization not found' })

    // 2. Get product template for defaults
    let template = null
    if (data.productTemplateId) {
      template = await prisma.productTemplate.findUnique({
        where: { id: Number(data.productTemplateId) }
      })
    }

    // 3. Get hosting plan abbreviation
    let hostingAbbr = 'DEF'
    if (data.hostingPlanId) {
      const hp = await prisma.hostingPlan.findUnique({ where: { id: Number(data.hostingPlanId) } })
      if (hp) hostingAbbr = hp.abbreviation
    }

    // 4. Resolve limits (explicit > template defaults > 0)
    const limitQuestions = Number(data.limitQuestions ?? template?.defaultQuestions ?? 0)
    const limitCases = Number(data.limitCases ?? template?.defaultCases ?? 0)
    const limitAdmins = Number(data.limitAdmins ?? template?.defaultAdmins ?? 1)
    const limitMobileUsers = Number(data.limitMobileUsers ?? template?.defaultMobileUsers ?? 0)
    const limitPhoneUsers = Number(data.limitPhoneUsers ?? template?.defaultPhoneUsers ?? 0)
    const limitDataEntries = Number(data.limitDataEntries ?? template?.defaultDataEntries ?? 0)
    const limitAnalysts = Number(data.limitAnalysts ?? template?.defaultAnalysts ?? 0)
    const limitClients = Number(data.limitClients ?? template?.defaultClients ?? 0)
    const limitClassifiers = Number(data.limitClassifiers ?? template?.defaultClassifiers ?? 0)
    const limitCaptureSupervisors = Number(data.limitCaptureSupervisors ?? template?.defaultCaptureSupervisors ?? 0)
    const limitKioskSupervisors = Number(data.limitKioskSupervisors ?? template?.defaultKioskSupervisors ?? 0)
    const limitParticipants = Number(data.limitParticipants ?? template?.defaultParticipants ?? 0)
    const concurrentQuestionnaires = Number(data.concurrentQuestionnaires ?? template?.concurrentQuestionnaires ?? 0)

    // 4.5. Check ownedByUserId 1-to-1 constraint
    if (data.ownedByUserId) {
      const existingLicense = await prisma.license.findUnique({ where: { ownedByUserId: Number(data.ownedByUserId) } })
      if (existingLicense) {
        return res.status(400).json({ error: 'El usuario seleccionado ya tiene una licencia asignada. Seleccione otro.' })
      }
    }

    // 5. Resolve MASTER user doing the operation
    const activatorUser = req.user

    // 5.5 Resolve Context Email for Serial
    let serialEmail = 'no-email@rotator.com';
    if (data.ownedByUserId) {
      const linkedUser = await prisma.user.findUnique({ where: { id: Number(data.ownedByUserId) } });
      if (linkedUser && linkedUser.email) serialEmail = linkedUser.email;
    } else if (org.users && org.users.length > 0) {
      const userWithoutLicense = await prisma.user.findFirst({
        where: { organizationId: org.id, ownedLicense: null },
        orderBy: { id: 'asc' }
      });
      if (userWithoutLicense && userWithoutLicense.email) {
        serialEmail = userWithoutLicense.email;
      } else if (org.users[0] && org.users[0].email) {
        serialEmail = org.users[0].email;
      }
    } else {
      if (org.useContactEmail) {
        serialEmail = org.useContactEmail;
      } else if (org.adminContactEmail) {
        serialEmail = org.adminContactEmail;
      } else if (org.email) {
        serialEmail = org.email;
      }
    }

    // 6. Generate serial key
    const serialKey = data.serialKey || generateSerial({
      countryCode: org.countryCode,
      versionAbbr: template?.abbreviation || 'ST',
      hostingAbbr,
      expirationDate: data.expirationDate || new Date('3000-01-01'),
      email: serialEmail,
      orgName: org.name,
      activatorFirstName: activatorUser.firstName,
      activatorLastName: activatorUser.lastName,
      activatorEmail: activatorUser.email
    })

    // 7. Read system settings for XOR config
    const majorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MAJOR' } })
    const minorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MINOR' } })
    const magicSetting = await prisma.systemSetting.findUnique({ where: { key: 'XOR_MAGIC_WORD' } })

    const expDate = data.expirationDate ? new Date(data.expirationDate) : new Date('3000-01-01')

    // 8. Generate encrypted activation key
    const encryptedActivationKey = generateEncryptedActivationKey({
      softwareVersionMajor: majorSetting?.value || '4',
      softwareVersionMinor: minorSetting?.value || '3',
      hardwareId: '0',
      versionId: template?.versionId ?? 0,
      expirationDate: expDate,
      hostingPlanId: Number(data.hostingPlanId || 0),
      serverType: data.licenseServers && data.licenseServers.length > 0 ? Number(data.licenseServers[0].serverNodeId) : 0,
      admins: limitAdmins,
      mobiles: limitMobileUsers,
      phones: limitPhoneUsers,
      dataEntries: limitDataEntries,
      analysts: limitAnalysts,
      classifiers: limitClassifiers,
      captureSups: limitCaptureSupervisors,
      kioskSups: limitKioskSupervisors,
      clients: limitClients,
      questions: limitQuestions,
    }, magicSetting?.value || 'yiyo')

    // 9. Create the license
    const license = await prisma.license.create({
      data: {
        organizationId: Number(data.organizationId),
        serialKey,
        friendlyName: data.friendlyName || null,
        productTemplateId: data.productTemplateId ? Number(data.productTemplateId) : null,
        status: data.status || 'ACTIVE',
        expirationDate: expDate,
        autoRenew: data.autoRenew || false,
        paypalSubId: data.paypalSubId || null,
        limitQuestions,
        limitCases,
        limitAdmins,
        limitMobileUsers,
        limitPhoneUsers,
        limitDataEntries,
        limitAnalysts,
        limitClients,
        limitClassifiers,
        limitCaptureSupervisors,
        limitKioskSupervisors,
        limitParticipants,
        concurrentQuestionnaires,
        hostingPlanId: data.hostingPlanId ? Number(data.hostingPlanId) : null,
        ownedByUserId: data.ownedByUserId ? Number(data.ownedByUserId) : null,
        encryptedActivationKey,
        activatedByUserId: activatorUser.id,
        notes: data.notes || null,
        licenseServers: data.licenseServers && Array.isArray(data.licenseServers) ? {
          create: data.licenseServers.map(ls => ({
            serverId: Number(ls.serverId || ls.serverNodeId),
            domainId: ls.domainId ? Number(ls.domainId) : null
          }))
        } : undefined
      },
      include: {
        organization: true,
        hostingPlan: true,
        productTemplate: true,
        licenseServers: { include: { server: true, domain: true } }
      }
    })

    // 10. Audit log
    logAction({
      req,
      action: 'CREATE',
      entity: 'License',
      entityId: String(license.id),
      details: `Licencia creada: ${serialKey} | Activada por: ${activatorUser.firstName + ' ' + activatorUser.lastName}`
    })

    res.status(201).json(license)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Serial key already exists' })
    console.error('License create error:', e)
    res.status(400).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// UPDATE a license (MASTER only) — Regenerates serial + key
// ─────────────────────────────────────────────────────────
router.put('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const data = req.body

    const updateData = {}

    // Direct field updates
    if (data.friendlyName !== undefined) updateData.friendlyName = data.friendlyName
    if (data.status !== undefined) updateData.status = data.status
    if (data.expirationDate !== undefined) updateData.expirationDate = new Date(data.expirationDate)
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew
    if (data.paypalSubId !== undefined) updateData.paypalSubId = data.paypalSubId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.productTemplateId !== undefined) updateData.productTemplateId = Number(data.productTemplateId) || null
    if (data.hostingPlanId !== undefined) updateData.hostingPlanId = Number(data.hostingPlanId) || null

    if (data.licenseServers !== undefined && Array.isArray(data.licenseServers)) {
      updateData.licenseServers = {
        deleteMany: {},
        create: data.licenseServers.map(ls => ({
          serverId: Number(ls.serverId || ls.serverNodeId),
          domainId: ls.domainId ? Number(ls.domainId) : null
        }))
      }
    }

    if (data.ownedByUserId !== undefined) {
      if (data.ownedByUserId) {
        const existingLicense = await prisma.license.findUnique({ where: { ownedByUserId: Number(data.ownedByUserId) } })
        if (existingLicense && existingLicense.id !== id) {
          return res.status(400).json({ error: 'El usuario seleccionado ya tiene otra licencia asignada. Seleccione otro.' })
        }
        updateData.ownedByUserId = Number(data.ownedByUserId)
      } else {
        updateData.ownedByUserId = null
      }
    }

    // Limit updates
    const limitFields = [
      'limitQuestions', 'limitCases', 'limitAdmins', 'limitMobileUsers',
      'limitPhoneUsers', 'limitDataEntries', 'limitAnalysts', 'limitClients',
      'limitClassifiers', 'limitCaptureSupervisors', 'limitKioskSupervisors',
      'limitParticipants', 'concurrentQuestionnaires'
    ]
    for (const field of limitFields) {
      if (data[field] !== undefined) updateData[field] = Number(data[field])
    }

    // Track who modified
    updateData.activatedByUserId = req.user.id

    const existingLicense = await prisma.license.findUnique({ 
        where: { id }, 
        include: { 
            organization: { include: { users: true } },
            licenseServers: true
        } 
    })
    if (!existingLicense) return res.status(404).json({ error: 'License not found' })

    const org = existingLicense.organization;
    const finalOwnedByUserId = updateData.ownedByUserId !== undefined ? updateData.ownedByUserId : existingLicense.ownedByUserId;

    // Resolve Context Email for Serial
    let serialEmail = 'no-email@rotator.com';
    if (finalOwnedByUserId) {
      const linkedUser = await prisma.user.findUnique({ where: { id: Number(finalOwnedByUserId) } });
      if (linkedUser && linkedUser.email) serialEmail = linkedUser.email;
    } else if (org.users && org.users.length > 0) {
      const userWithoutLicense = await prisma.user.findFirst({
        where: { organizationId: org.id, ownedLicense: null },
        orderBy: { id: 'asc' }
      });
      if (userWithoutLicense && userWithoutLicense.email) {
        serialEmail = userWithoutLicense.email;
      } else if (org.users[0] && org.users[0].email) {
        serialEmail = org.users[0].email;
      }
    } else {
      if (org.useContactEmail) {
        serialEmail = org.useContactEmail;
      } else if (org.adminContactEmail) {
        serialEmail = org.adminContactEmail;
      } else if (org.email) {
        serialEmail = org.email;
      }
    }

    // Recalculate Serial and Activation Key
    const { generateSerial } = await import('../services/licenseSerial.js');
    const { generateEncryptedActivationKey } = await import('../services/licenseEncryption.js');

    const templateId = updateData.productTemplateId !== undefined ? updateData.productTemplateId : existingLicense.productTemplateId;
    let template = null;
    if (templateId) template = await prisma.productTemplate.findUnique({ where: { id: templateId } });

    const hostingId = updateData.hostingPlanId !== undefined ? updateData.hostingPlanId : existingLicense.hostingPlanId;
    let hostingAbbr = 'DEF';
    if (hostingId) {
      const hp = await prisma.hostingPlan.findUnique({ where: { id: hostingId } });
      if (hp) hostingAbbr = hp.abbreviation;
    }

    const expDate = updateData.expirationDate !== undefined ? updateData.expirationDate : existingLicense.expirationDate;

    updateData.serialKey = generateSerial({
      countryCode: org.countryCode,
      versionAbbr: template?.abbreviation || 'ST',
      hostingAbbr,
      expirationDate: expDate || new Date('3000-01-01'),
      email: serialEmail,
      orgName: org.name,
      activatorFirstName: req.user.firstName,
      activatorLastName: req.user.lastName,
      activatorEmail: req.user.email
    });

    const majorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MAJOR' } })
    const minorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MINOR' } })
    const magicSetting = await prisma.systemSetting.findUnique({ where: { key: 'XOR_MAGIC_WORD' } })
    
    const getLimit = (field) => updateData[field] !== undefined ? updateData[field] : existingLicense[field];

    updateData.encryptedActivationKey = generateEncryptedActivationKey({
      softwareVersionMajor: majorSetting?.value || '4',
      softwareVersionMinor: minorSetting?.value || '3',
      hardwareId: '0',
      versionId: template?.versionId ?? 0,
      expirationDate: expDate || new Date('3000-01-01'),
      hostingPlanId: Number(hostingId || 0),
      serverType: data.licenseServers && data.licenseServers.length > 0 
                    ? Number(data.licenseServers[0].serverNodeId) 
                    : (existingLicense.licenseServers?.length > 0 ? existingLicense.licenseServers[0].serverNodeId : 0),
      admins: getLimit('limitAdmins'),
      mobiles: getLimit('limitMobileUsers'),
      phones: getLimit('limitPhoneUsers'),
      dataEntries: getLimit('limitDataEntries'),
      analysts: getLimit('limitAnalysts'),
      classifiers: getLimit('limitClassifiers'),
      captureSups: getLimit('limitCaptureSupervisors'),
      kioskSups: getLimit('limitKioskSupervisors'),
      clients: getLimit('limitClients'),
      questions: getLimit('limitQuestions'),
    }, magicSetting?.value || 'yiyo');

    const license = await prisma.license.update({
      where: { id },
      data: updateData,
      include: { 
          organization: true, 
          hostingPlan: true, 
          productTemplate: true,
          licenseServers: { include: { server: true } }
      }
    })

    logAction({
      req,
      action: 'UPDATE',
      entity: 'License',
      entityId: String(license.id),
      details: `Licencia modificada por: ${req.user.firstName + ' ' + req.user.lastName}`
    })

    res.json(license)
  } catch (e) {
    console.error('License update error:', e)
    res.status(400).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// DELETE a license (MASTER only)
// ─────────────────────────────────────────────────────────
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.license.delete({ where: { id } })
    logAction({ req, action: 'DELETE', entity: 'License', entityId: String(id), details: 'Licencia eliminada' })
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────────────────
// KILL ALL activations for a license (MASTER only)
// DELETE /licenses/:id/activations
// ─────────────────────────────────────────────────────────
router.delete('/:id/activations', authRequired, requireMaster, async (req, res) => {
  try {
    const licenseId = Number(req.params.id)
    const license = await prisma.license.findUnique({ where: { id: licenseId } })
    if (!license) return res.status(404).json({ error: 'License not found' })

    const result = await prisma.activationLog.deleteMany({ where: { licenseId } })

    logAction({
      req,
      action: 'KILL_ALL',
      entity: 'ActivationLog',
      entityId: String(licenseId),
      details: `Todas las activaciones eliminadas (${result.count}) para licencia ${license.serialKey}`
    })

    res.json({ deleted: result.count, serialKey: license.serialKey })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
