/**
 * @file settings.js
 * @description Definición de rutas API para el módulo settings.
 * @module Backend Route
 * @path /backend/src/routes/settings.js
 * @lastUpdated 2026-04-20
 * @author Sistema
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired as requireAuth } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()
// Utiliza la instancia global de prisma importada arriba

// GET /settings
router.get('/', requireAuth, requireMaster, async (req, res) => {
    const settings = await prisma.systemSetting.findMany({ orderBy: { group: 'asc' } })
    res.json(settings)
})

// PUT /settings (Bulk update or create)
router.put('/', requireAuth, requireMaster, async (req, res) => {
    const items = req.body // Array of { key, value }
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Array expected' })

    try {
        const updates = []
        for (const item of items) {
            if (item.key && item.value !== undefined) {
                updates.push(prisma.systemSetting.upsert({
                    where: { key: item.key },
                    update: { value: String(item.value) },
                    create: { key: item.key, value: String(item.value), group: 'General' }
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

// DELETE /settings/:key
router.delete('/:key', requireAuth, requireMaster, async (req, res) => {
    try {
        const { key } = req.params;
        const exists = await prisma.systemSetting.findUnique({ where: { key } })
        if (!exists) return res.status(404).json({ error: 'Setting not found' })

        await prisma.systemSetting.delete({ where: { key } })
        
        // Audit
        if (req.user) {
            logAction({
                req,
                action: 'DELETE',
                entity: 'Ajuste',
                entityId: key,
                entityName: key,
                details: `Ajuste eliminado: ${key}`,
                ip: req.ip
            })
        }
        res.json({ message: 'Setting deleted' })
    } catch (e) {
        res.status(500).json({ error: 'Error deleting setting' })
    }
})

// Public endpoint for specific settings (e.g. site_name)
router.get('/public', async (req, res) => {
    const publicKeys = ['site_name', 'site_description', 'maintenance_mode']
    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: publicKeys } }
    })
    const map = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    res.json(map)
})

export default router
