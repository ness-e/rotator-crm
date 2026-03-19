import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const router = Router()

// ... (existing analytics routes)

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
    isMaster: z.union([z.boolean(), z.string()]).optional(),
    isActive: z.union([z.boolean(), z.string()]).optional()
})

/**
 * Helper to process organization data
 */
async function processOrgData(data, isUpdate = false) {
    const allowedFields = ['name', 'email', 'taxId', 'countryCode', 'city', 'address', 'clientType', 'isMaster', 'isActive']
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

    return processed
}

// GET /organizations
router.get('/organizations', authRequired, async (req, res) => {
    try {
        const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'
        
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
