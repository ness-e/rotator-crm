/**
 * @file templates.js
 * @description Definición de rutas API para el módulo templates.
 * @module Backend Route
 * @path /backend/src/routes/templates.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /templates
router.get('/', authRequired, requireMaster, async (req, res) => {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } })
    res.json(templates)
})

// POST /templates (Create or Update by Code)
// Useful for seeding or creating custom templates
router.post('/', authRequired, requireMaster, async (req, res) => {
    try {
        const data = {
            code: req.body.code,
            name: req.body.name,
            subject: req.body.subject,
            body: req.body.body,
            variables: req.body.variables // Expecting string or we stringify it
        }

        // Ensure variables is string
        if (typeof data.variables !== 'string' && data.variables) {
            data.variables = JSON.stringify(data.variables)
        }

        const template = await prisma.emailTemplate.upsert({
            where: { code: data.code },
            update: data,
            create: data
        })

        logAction({
            req,
            action: 'UPDATE',
            entity: 'EmailTemplate',
            entityId: template.id,
            entityName: template.code,
            details: `Plantilla ${template.code} creada/actualizada`
        })

        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// PUT /templates/:id
router.put('/:id', authRequired, requireMaster, async (req, res) => {
    try {
        const id = Number(req.params.id)
        const data = {
            name: req.body.name,
            subject: req.body.subject,
            body: req.body.body,
            variables: req.body.variables
        }

        if (typeof data.variables !== 'string' && data.variables) {
            data.variables = JSON.stringify(data.variables)
        }

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: {
                name: data.name ?? undefined,
                subject: data.subject ?? undefined,
                body: data.body ?? undefined,
                variables: data.variables ?? undefined
            }
        })

        logAction({
            req,
            action: 'UPDATE',
            entity: 'EmailTemplate',
            entityId: template.id,
            entityName: template.code,
            details: `Plantilla ${template.code} actualizada`
        })

        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// DELETE /templates/:id
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
    try {
        const id = Number(req.params.id)
        await prisma.emailTemplate.delete({ where: { id } })
        res.json({ ok: true })
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router
