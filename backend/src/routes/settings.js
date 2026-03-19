/**
 * @file settings.js
 * @description Definición de rutas API para el módulo settings.
 * @module Backend Route
 * @path /backend/src/routes/settings.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authRequired as requireAuth } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()
const prisma = new PrismaClient()

// GET /settings
// Require MASTER or Permission (will use MASTER for now)
router.get('/', requireAuth, requireMaster, async (req, res) => {
    const settings = await prisma.systemSetting.findMany({ orderBy: { group: 'asc' } })
    // Convert config array to object grouped or just list
    res.json(settings)
})

// PUT /settings (Bulk update)
router.put('/', requireAuth, requireMaster, async (req, res) => {
    const items = req.body // Array of { key, value }
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Array expected' })

    try {
        const updates = []
        for (const item of items) {
            if (item.key && item.value !== undefined) {
                updates.push(prisma.systemSetting.update({
                    where: { key: item.key },
                    data: { value: String(item.value) }
                }))
            }
        }
        await prisma.$transaction(updates)

        // Audit
        if (req.user) {
            const keys = items.map(i => i.key).join(', ')
            logAction({
                req,
                action: 'UPDATE',
                entity: 'Ajuste',
                entityId: 'BULK',
                entityName: 'Sistema',
                details: `Ajustes actualizados: ${keys}`,
                ip: req.ip
            })
        }

        res.json({ message: 'Settings updated' })
    } catch (e) {
        res.status(500).json({ error: 'Error updating settings' })
    }
})

// Public endpoint for specific settings (e.g. site_name) if needed?
// Maybe /settings/public
router.get('/public', async (req, res) => {
    const publicKeys = ['site_name', 'site_description', 'maintenance_mode']
    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: publicKeys } }
    })
    const map = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    res.json(map)
})

export default router
