/**
 * @file roles.js
 * @description Definición de rutas API para el módulo roles.
 * @module Backend Route
 * @path /backend/src/routes/roles.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authRequired as requireAuth } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { z } from 'zod'
import { validateBody } from '../middleware/validate.js'
import { logAction } from '../services/audit.service.js'

const router = Router()
const prisma = new PrismaClient()

// Schema
const RoleSchema = z.object({
    name: z.string().min(1).regex(/^[A-Z_]+$/, 'Solo mayúsculas y guiones bajos'),
    description: z.string().optional(),
    permissions: z.array(z.string())
})

// GET /roles
router.get('/', requireAuth, requireMaster, async (req, res) => {
    const roles = await prisma.role.findMany({ orderBy: { createdAt: 'asc' } })
    // Parse permissions
    const parsed = roles.map(r => ({
        ...r,
        permissions: JSON.parse(r.permissions)
    }))
    res.json(parsed)
})

// POST /roles
router.post('/', requireAuth, requireMaster, validateBody(RoleSchema), async (req, res) => {
    const data = req.validated.body
    try {
        const role = await prisma.role.create({
            data: {
                name: data.name,
                description: data.description,
                permissions: JSON.stringify(data.permissions),
                isSystem: false
            }
        })
        logAction({ req, action: 'CREATE', entity: 'Role', entityId: role.name, entityName: role.name, details: `Rol creado: ${role.name}` })
        res.status(201).json({ ...role, permissions: data.permissions })
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Role already exists' })
        res.status(500).json({ error: 'Error creating role' })
    }
})

// PUT /roles/:name
router.put('/:name', requireAuth, requireMaster, validateBody(RoleSchema), async (req, res) => {
    const { name } = req.params
    const data = req.validated.body

    const old = await prisma.role.findUnique({ where: { name } })
    if (!old) return res.status(404).json({ error: 'Role not found' })

    try {
        const role = await prisma.role.update({
            where: { name },
            data: {
                description: data.description,
                permissions: JSON.stringify(data.permissions)
            }
        })

        const changes = []
        if (data.description !== undefined && old.description !== data.description)
            changes.push(`Desc: "${old.description || ''}" -> "${data.description}"`)

        const oldPerms = JSON.parse(old.permissions).sort()
        const newPerms = data.permissions.sort()
        if (JSON.stringify(oldPerms) !== JSON.stringify(newPerms)) {
            changes.push(`Permisos: ${oldPerms.length} -> ${newPerms.length} (${newPerms.join(', ')})`)
        }

        logAction({
            req,
            action: 'UPDATE',
            entity: 'Rol',
            entityId: name,
            entityName: name,
            details: changes.length > 0 ? `Modificado: ${changes.join(', ')}` : 'Actualizado sin cambios'
        })
        res.json({ ...role, permissions: data.permissions })
    } catch (e) {
        res.status(500).json({ error: 'Error updating role' })
    }
})

// DELETE /roles/:name
router.delete('/:name', requireAuth, requireMaster, async (req, res) => {
    const { name } = req.params
    const current = await prisma.role.findUnique({ where: { name } })
    if (!current) return res.status(404).json({ error: 'Role not found' })
    if (current.isSystem) return res.status(400).json({ error: 'Cannot delete system role' })

    // Check usage? user.tipo_usuario
    const used = await prisma.user.findFirst({ where: { tipo_usuario: name } })
    if (used) return res.status(400).json({ error: 'Role is assigned to users' })

    await prisma.role.delete({ where: { name } })
    logAction({ req, action: 'DELETE', entity: 'Role', entityId: name, entityName: name, details: 'Rol eliminado' })
    res.status(204).end()
})

export default router
