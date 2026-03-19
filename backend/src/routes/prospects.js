/**
 * @file prospects.js
 * @description Definición de rutas API para el módulo prospects.
 * @module Backend Route
 * @path /backend/src/routes/prospects.js
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

// Schema definitions
const ProspectSchema = z.object({
    company: z.string().min(1, 'La empresa es requerida'),
    contactName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    country: z.string().optional(),
    status: z.string().optional(),
    interestLevel: z.coerce.number().min(0).max(100).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    nextFollowUp: z.string().optional().or(z.date())
})

// GET /prospects
router.get('/', authRequired, requireMaster, async (req, res) => {
    try {
        const prospects = await prisma.prospect.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        })
        res.json(prospects)
    } catch (e) {
        res.status(500).json({ error: 'Error processing prospects' })
    }
})

// POST /prospects
router.post('/', authRequired, requireMaster, validateBody(ProspectSchema), async (req, res) => {
    try {
        const data = req.validated.body
        const prospect = await prisma.prospect.create({
            data: {
                company: data.company,
                contactName: data.contactName,
                email: data.email,
                phone: data.phone,
                country: data.country,
                status: data.status || 'NUEVO',
                interestLevel: data.interestLevel || 50,
                source: data.source,
                notes: data.notes,
                nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null
            }
        })

        logAction({
            req,
            action: 'CREATE',
            entity: 'Prospect',
            entityId: String(prospect.id),
            details: `Prospecto creado: ${prospect.company}`
        })

        res.status(201).json(prospect)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// PUT /prospects/:id
router.put('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        // Manually pick allowed fields to avoid passing dirt to Prisma
        const data = req.body
        const allowed = {}
        if (data.company !== undefined) allowed.company = data.company
        if (data.contactName !== undefined) allowed.contactName = data.contactName
        if (data.email !== undefined) allowed.email = data.email
        if (data.phone !== undefined) allowed.phone = data.phone
        if (data.country !== undefined) allowed.country = data.country
        if (data.status !== undefined) allowed.status = data.status
        if (data.interestLevel !== undefined) allowed.interestLevel = Number(data.interestLevel)
        if (data.source !== undefined) allowed.source = data.source
        if (data.notes !== undefined) allowed.notes = data.notes
        if (data.nextFollowUp !== undefined) allowed.nextFollowUp = data.nextFollowUp ? new Date(data.nextFollowUp) : null

        const updated = await prisma.prospect.update({
            where: { id },
            data: allowed
        })
        res.json(updated)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// DELETE /prospects/:id
router.delete('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        await prisma.prospect.delete({ where: { id } })
        res.status(204).end()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router
