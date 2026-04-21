/**
 * @file templates.js
 * @description Definición de rutas API para el módulo templates.
 * @module Backend Route
 * @path /backend/src/routes/templates.js
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()

// GET /templates
router.get('/', authRequired, requireMaster, async (req, res) => {
    try {
        const templates = await prisma.emailTemplate.findMany({ 
            orderBy: { code: 'asc' } 
        })
        res.json(templates)
    } catch (e) {
        console.error('Error fetching templates:', e)
        res.status(500).json({ error: 'Error al obtener plantillas' })
    }
})

// POST /templates (Create or Update by Code)
router.post('/', authRequired, requireMaster, async (req, res) => {
    try {
        const { code, name, subject, body, variables } = req.body
        
        if (!code) return res.status(400).json({ error: 'El código es requerido' })

        const data = {
            code: code.toUpperCase(),
            name: name || code,
            subject: subject || 'Sin asunto',
            body: body || '',
            variables: typeof variables === 'string' ? variables : JSON.stringify(variables || [])
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
            entityId: String(template.id),
            entityName: template.code,
            details: `Plantilla ${template.code} gestionada via POST`
        })

        res.json(template)
    } catch (e) {
        console.error('Error in POST /templates:', e)
        res.status(400).json({ error: e.message })
    }
})

// PUT /templates/:id
router.put('/:id', authRequired, requireMaster, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

        const { name, subject, body, variables } = req.body
        
        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (subject !== undefined) updateData.subject = subject
        if (body !== undefined) updateData.body = body
        if (variables !== undefined) {
            updateData.variables = typeof variables === 'string' ? variables : JSON.stringify(variables)
        }

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: updateData
        })

        logAction({
            req,
            action: 'UPDATE',
            entity: 'EmailTemplate',
            entityId: String(template.id),
            entityName: template.code,
            details: `Plantilla ${template.code} actualizada`
        })

        res.json(template)
    } catch (e) {
        console.error('Error in PUT /templates/:id:', e)
        res.status(400).json({ error: e.message })
    }
})

// DELETE /templates/:id
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

        await prisma.emailTemplate.delete({ where: { id } })
        
        res.json({ ok: true })
    } catch (e) {
        console.error('Error in DELETE /templates/:id:', e)
        res.status(400).json({ error: e.message })
    }
})

export default router
