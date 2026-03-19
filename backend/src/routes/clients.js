/**
 * @file clients.js
 * @description Definición de rutas API para el módulo clients.
 * @module Backend Route
 * @path /backend/src/routes/clients.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { ParamIdSchema } from '../validation/schemas.js'
import { logAction } from '../services/audit.service.js'
import { z } from 'zod'

const router = Router()

// GET /clients - Unified Endpoint for AdminClients (Legacy Compatibility)
router.get('/', authRequired, requireMaster, async (req, res) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: {
                users: true,
                licenses: { include: { productTemplate: true } }, // Include template for type
                marketTarget: true
            },
            orderBy: { name: 'asc' }
        })

        // 1. Calculate Stats (Logic from crm-stats)
        let activeClients = 0
        let totalLicenses = 0
        let expiredLicenses = 0
        const now = new Date()
        const typeCount = { A: 0, B: 0, C: 0, D: 0 }
        const countryCount = {}
        const serverCount = {} // frontend expects this
        const studyCount = {} // frontend expects this
        const businessCount = {} // frontend expects this

        // 2. Map Users (Organizations -> Legacy User View)
        const mappedUsers = orgs.map(o => {
            // Metrics
            const t = o.clientType || 'C'
            if (typeCount[t] !== undefined) typeCount[t]++

            const c = o.countryCode || 'XX'
            countryCount[c] = (countryCount[c] || 0) + 1

            const market = o.marketTarget?.name || 'Desconocido'
            businessCount[market] = (businessCount[market] || 0) + 1

            // Licenses logic
            let primaryLicense = null
            if (o.licenses.length > 0) {
                activeClients++
                // Pick most relevant license (latest expiration?)
                primaryLicense = o.licenses.sort((a, b) => new Date(b.expirationDate) - new Date(a.expirationDate))[0]
            }

            if (primaryLicense) {
                if (primaryLicense.expirationDate && new Date(primaryLicense.expirationDate) < now) expiredLicenses++
                totalLicenses++

                const sType = primaryLicense.hostingType || 'LOCAL' // Where to get this? Maybe infer or usage?
                serverCount[sType] = (serverCount[sType] || 0) + 1
            }

            // Map to Legacy User Structure
            return {
                id_cliente: o.id,
                organizacion_cliente: o.name,
                nombre_cliente: o.users[0]?.fullName || 'Sin Contacto',
                apellido_cliente: '',
                pais_cliente: o.countryCode,
                ciudad_cliente: o.city,
                correo_cliente: o.users[0]?.email || '', // Member email
                admin_email: 'master@rotator.com', // Placeholder? Or lookup Executive
                client_type: o.clientType,
                fecha_registro: o.createdAt.toISOString().split('T')[0],
                renewal_status: primaryLicense ? (new Date(primaryLicense.expirationDate) < now ? 'EXPIRED' : 'ACTIVE') : 'NONE',
                marketTarget: o.marketTarget,
                business_type: o.marketTarget?.name,
                license: primaryLicense ? {
                    licencia_expira: primaryLicense.expirationDate ? primaryLicense.expirationDate.toISOString().split('T')[0] : 'N/A',
                    licencia_tipo: primaryLicense.productTemplate?.name || 'Licencia',
                    hosting: false // TODO: Check hosting
                } : null
            }
        })

        const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0] || ['-', 0]
        // Calculate Top Plan if possible (skipped for brevity, passing placeholder)

        res.json({
            stats: {
                period: {
                    renewed: 0, // Mock
                    notRenewed: expiredLicenses,
                    inProcess: 0, // Mock
                    webRenewals: 0 // Mock
                },
                newClients: { total: 0, invoice: 0, web: 0 },
                topCountry: { name: topCountry[0], count: topCountry[1] },
                topPlan: { name: 'Standard', count: 0 },
                pivot: {
                    typeCount,
                    businessCount,
                    serverCount,
                    studyCount: {}
                }
            },
            users: mappedUsers
        })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error fetching clients' })
    }
})

// GET /clients/active - List Organizations
router.get('/active', authRequired, requireMaster, async (req, res) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: {
                users: true,
                licenses: true
            },
            orderBy: { name: 'asc' }
        })
        res.json(orgs)
    } catch (e) {
        res.status(500).json({ error: 'Error fetching organizations' })
    }
})

// GET /clients/crm-stats - Unified Stats
router.get('/crm-stats', authRequired, requireMaster, async (req, res) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: { licenses: true }
        })

        // Metrics
        let activeClients = 0
        let totalLicenses = 0
        let expiredLicenses = 0
        const now = new Date()

        // Pivot Data
        const typeCount = { A: 0, B: 0, C: 0, D: 0 }
        const countryCount = {}
        const hostingCount = {}

        orgs.forEach(o => {
            // Count client types
            const t = o.clientType || 'C'
            if (typeCount[t] !== undefined) typeCount[t]++

            // Country
            const c = o.countryCode || 'XX'
            countryCount[c] = (countryCount[c] || 0) + 1

            // Licenses
            if (o.licenses.length > 0) activeClients++
            o.licenses.forEach(l => {
                totalLicenses++
                if (l.expirationDate && new Date(l.expirationDate) < now) expiredLicenses++

                const h = l.hostingType || 'UNKNOWN'
                hostingCount[h] = (hostingCount[h] || 0) + 1
            })
        })

        const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0] || ['-', 0]

        res.json({
            activeClients,
            totalLicenses,
            expiredLicenses,
            topCountry: { name: topCountry[0], count: topCountry[1] },
            pivot: {
                typeCount,
                countryCount,
                hostingCount
            }
        })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error calculating CRM stats' })
    }
})

// GET /clients/:id - Get Organization Detail
router.get('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    const org = await prisma.organization.findUnique({
        where: { id },
        include: {
            users: true,
            licenses: { include: { serverNode: true, activations: true } }
        }
    })
    if (!org) return res.status(404).json({ error: 'Organization not found' })
    res.json(org)
})

const updateSchema = z.object({
    name: z.string().optional(),
    taxId: z.string().optional(),
    countryCode: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    clientType: z.string().optional()
})

// PUT /clients/:id - Update Organization
router.put('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        const body = updateSchema.parse(req.body)
        const updated = await prisma.organization.update({
            where: { id },
            data: body
        })

        logAction({
            req,
            action: 'UPDATE',
            entity: 'Organizacion',
            entityId: String(id),
            details: 'Detalles de organización actualizados'
        })

        res.json(updated)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router
