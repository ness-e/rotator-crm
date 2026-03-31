import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getLanguageFromCountry } from '../services/languageService.js'

import { requireMaster } from '../middleware/roles.js'

const router = Router()

// ─────────────────────────────────────────────────────────
// GET /crm/churn-by-country — Analytics for Churn
// ─────────────────────────────────────────────────────────
router.get('/churn-by-country', authRequired, requireMaster, async (req, res) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: { licenses: true }
        })
        
        const churnByCountry = {}
        const now = new Date()
        
        orgs.forEach(o => {
            if (o.licenses.length === 0) return 
            const hasActive = o.licenses.some(l => l.expirationDate && l.expirationDate > now)
            if (!hasActive) {
                const c = o.countryCode || 'Unknown'
                churnByCountry[c] = (churnByCountry[c] || 0) + 1
            }
        })
        
        const data = Object.entries(churnByCountry).map(([country, count]) => ({ country, count }))
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// ─────────────────────────────────────────────────────────
// GET /crm/metrics — CRM Analytics (AdminCRMDashboard.jsx)
// ─────────────────────────────────────────────────────────
router.get('/metrics', authRequired, requireMaster, async (req, res) => {
    try {
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        const [orgs, licenses, users] = await Promise.all([
            prisma.organization.findMany({ include: { licenses: { include: { productTemplate: true } } } }),
            prisma.license.findMany({ include: { productTemplate: true, organization: true } }),
            prisma.user.count()
        ])

        // Financial
        let totalMonthlyRevenue = 0
        const licensesByType = {}
        let activeLicenses = 0
        let expiredLicenses = 0
        const expiringSoonAlerts = []

        licenses.forEach(l => {
            const planName = l.productTemplate?.name || 'Sin Plan'
            licensesByType[planName] = (licensesByType[planName] || 0) + 1

            const monthlyPrice = l.productTemplate?.priceMonthly || 0
            const isExpired = l.expirationDate && new Date(l.expirationDate) < now
            const isExpiringSoon = l.expirationDate && !isExpired && new Date(l.expirationDate) <= thirtyDaysFromNow

            if (!isExpired) {
                activeLicenses++
                totalMonthlyRevenue += monthlyPrice
            } else {
                expiredLicenses++
            }

            if (isExpiringSoon) {
                const daysUntil = Math.ceil((new Date(l.expirationDate) - now) / (1000 * 60 * 60 * 24))
                expiringSoonAlerts.push({
                    id_licencia: l.id,
                    organization: l.organization?.name || 'Sin org',
                    email: l.organization?.email || '',
                    licencia_expira: l.expirationDate,
                    daysUntilExpiry: daysUntil
                })
            }
        })

        const totalLicenses = licenses.length
        const mrr = totalMonthlyRevenue
        const arr = mrr * 12
        const arpu = totalLicenses > 0 ? mrr / totalLicenses : 0
        const ltv = arpu * 24 // Assume 24 month avg lifetime

        const renewalRate = totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 0
        const churnRate = 100 - renewalRate

        // Top country
        const countryCount = {}
        orgs.forEach(o => {
            const c = o.countryCode || 'XX'
            countryCount[c] = (countryCount[c] || 0) + 1
        })
        const topCountryEntry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0]

        // Top plan
        const topPlanEntry = Object.entries(licensesByType).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0]

        res.json({
            financial: { mrr, arr, ltv, arpu, currency: 'USD' },
            retention: { renewalRate, churnRate, expiringSoon: expiringSoonAlerts.length, activeLicenses, expiredLicenses },
            customers: { totalUsers: users, totalLicenses, topCountry: topCountryEntry[0], topPlan: topPlanEntry[0], licensesByType },
            alerts: { expiringSoon: expiringSoonAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry) }
        })
    } catch (e) {
        console.error('CRM Metrics error:', e)
        res.status(500).json({ error: e.message })
    }
})
/**
 * Organization Management Routes
 */

const OrgSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6).optional().or(z.literal('')),
    taxId: z.string().optional(),
    countryCode: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    clientType: z.string().default('C'),
    notes: z.string().nullable().optional(),
    isMaster: z.union([z.boolean(), z.string()]).optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    phone: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    marketTargetId: z.number().nullable().optional(),
    ejecutivoId: z.number().nullable().optional(),
    language: z.string().nullable().optional(),
    adminContactName: z.string().nullable().optional(),
    adminContactLastName: z.string().nullable().optional(),
    adminContactEmail: z.string().nullable().optional().or(z.literal('')),
    useContactName: z.string().nullable().optional(),
    useContactLastName: z.string().nullable().optional(),
    useContactEmail: z.string().nullable().optional().or(z.literal('')),
    businessType: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    primerContactoId: z.number().nullable().optional()
})

/**
 * Helper to process organization data
 */
async function processOrgData(data, isUpdate = false) {
    const allowedFields = [
        'name', 'email', 'taxId', 'countryCode', 'city', 'address', 'clientType', 'notes', 'isMaster', 'isActive',
        'phone', 'source', 'marketTargetId', 'ejecutivoId', 'language',
        'adminContactName', 'adminContactLastName', 'adminContactEmail',
        'useContactName', 'useContactLastName', 'useContactEmail',
        'businessType', 'status', 'primerContactoId'
    ]
    const processed = {}

    Object.keys(data).forEach(key => {
        if (allowedFields.includes(key)) {
            processed[key] = data[key]
        }
    })

    if (data.password && data.password.trim() !== '') {
        const salt = await bcrypt.genSalt(10)
        processed.password = await bcrypt.hash(data.password, salt)
    } else if (isUpdate) {
        delete processed.password // Don't overwrite with empty if updating
    }

    if (processed.isMaster !== undefined) {
        processed.isMaster = String(processed.isMaster) === 'true'
    }
    if (processed.isActive !== undefined) {
        processed.isActive = String(processed.isActive) === 'true'
    }

    // Auto-derive language from countryCode
    if (processed.countryCode) {
        processed.language = getLanguageFromCountry(processed.countryCode)
    }

    return processed
}

// GET /organizations
router.get('/organizations', authRequired, async (req, res) => {
    try {
        const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER'
        
        const where = {}
        if (!isMaster) {
            if (!req.user.orgId) return res.status(403).json({ error: 'Forbidden: No organization assigned' })
            const targetOrgId = req.user.orgId
            where.id = targetOrgId
        }

        const orgs = await prisma.organization.findMany({
            where,
            include: {
                _count: {
                    select: { users: true, licenses: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orgs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /organizations
router.post('/organizations', authRequired, validateBody(OrgSchema), async (req, res) => {
    try {
        const data = await processOrgData(req.validated.body)
        const org = await prisma.organization.create({
            data
        });

        // Auto-create default user and license
        const defaultEmail = org.useContactEmail || org.adminContactEmail || org.email;
        if (defaultEmail && defaultEmail.trim() !== '') {
            const existingUser = await prisma.user.findUnique({ where: { email: defaultEmail } });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Rotator2026', salt);
                
                const userFirstName = org.useContactName || org.adminContactName || 'Admin';
                const userLastName = org.useContactLastName || org.adminContactLastName || 'Usuario';
                
                const newUser = await prisma.user.create({
                    data: {
                        email: defaultEmail,
                        password: hashedPassword,
                        firstName: userFirstName,
                        lastName: userLastName,
                        role: 'CLIENTE',
                        organizationId: org.id,
                        isActive: true
                    }
                });

                // Auto-create default license
                const { generateSerial } = await import('../services/licenseSerial.js');
                const { generateEncryptedActivationKey } = await import('../services/licenseEncryption.js');
                const expDate = new Date('3000-01-01');
                
                const serialKey = generateSerial({
                    countryCode: org.countryCode,
                    versionAbbr: 'ST',
                    hostingAbbr: 'DEF',
                    expirationDate: expDate,
                    email: newUser.email,
                    orgName: org.name,
                    activatorFirstName: req.user.firstName,
                    activatorLastName: req.user.lastName,
                    activatorEmail: req.user.email
                });

                // Retrieve system configs for encryption
                const majorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MAJOR' } });
                const minorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MINOR' } });
                const magicSetting = await prisma.systemSetting.findUnique({ where: { key: 'XOR_MAGIC_WORD' } });

                const encryptedActivationKey = generateEncryptedActivationKey({
                    softwareVersionMajor: majorSetting?.value || '4',
                    softwareVersionMinor: minorSetting?.value || '3',
                    hardwareId: '0', versionId: 0, expirationDate: expDate, hostingPlanId: 0, serverType: 0,
                    admins: 1, mobiles: 0, phones: 0, dataEntries: 0, analysts: 0, classifiers: 0,
                    captureSups: 0, kioskSups: 0, clients: 0, questions: 100
                }, magicSetting?.value || 'yiyo');

                await prisma.license.create({
                    data: {
                        organizationId: org.id,
                        ownedByUserId: newUser.id,
                        serialKey,
                        status: 'ACTIVE',
                        expirationDate: expDate,
                        limitQuestions: 100, limitCases: 0, limitAdmins: 1, limitMobileUsers: 0, limitPhoneUsers: 0,
                        limitDataEntries: 0, limitAnalysts: 0, limitClients: 0, limitClassifiers: 0, limitCaptureSupervisors: 0,
                        limitKioskSupervisors: 0, limitParticipants: 0, concurrentQuestionnaires: 0,
                        encryptedActivationKey,
                        activatedByUserId: req.user.id,
                        notes: 'Licencia por defecto generada automáticamente.'
                    }
                });
            }
        }

        res.json(org);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// PUT /organizations/:id
router.put('/organizations/:id', authRequired, validateBody(OrgSchema.partial()), async (req, res) => {
    try {
        const data = await processOrgData(req.validated.body, true)
        const org = await prisma.organization.update({
            where: { id: Number(req.params.id) },
            data
        });
        res.json(org);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// DELETE /organizations/:id
router.delete('/organizations/:id', authRequired, async (req, res) => {
    try {
        const id = Number(req.params.id)
        // Check for licenses first to give better error message
        const licensesCount = await prisma.license.count({ where: { organizationId: id } })
        if (licensesCount > 0) {
            return res.status(400).json({ error: `No se puede eliminar: La organización tiene ${licensesCount} licencias activas.` })
        }

        await prisma.organization.delete({ where: { id } })
        res.json({ ok: true })
    } catch (e) {
        if (e.code === 'P2003') {
            return res.status(400).json({ error: 'No se puede eliminar: Hay registros asociados (Usuarios/Licencias).' })
        }
        res.status(400).json({ error: e.message });
    }
});


export default router
