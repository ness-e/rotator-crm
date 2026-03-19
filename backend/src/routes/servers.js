/**
 * @file servers.js
 * @description Rutas para gestión de servidores e infraestructura de hosting
 * 
 * @usage
 * - Dónde se utiliza: Montado en /api/servers en backend/src/index.js
 * - Cuándo se utiliza: Gestión de servidores, cálculo de costos, alertas de vencimiento
 * 
 * @functionality
 * - GET / - Listar todos los servidores
 * - GET /:id - Obtener detalles de un servidor
 * - GET /costs - Calcular costos totales mensuales/anuales por proveedor y tamaño
 * - GET /expiring - Listar servidores con próximo pago en 30 días
 * - POST / - Crear nuevo servidor
 * - PUT /:id - Actualizar servidor existente
 * - DELETE /:id - Eliminar servidor
 * 
 * @dependencies
 * - @prisma/client - Acceso a base de datos
 * - decimal.js - Manejo de valores monetarios
 * 
 * @relatedFiles
 * - middleware/auth.js - Autenticación requerida
 * - middleware/roles.js - Verificación de permisos
 * - prisma/schema.prisma - Modelo ServerNode
 * - frontend/src/pages/HostingCosts.jsx - Consumidor de /costs
 * - frontend/src/pages/AdminServersAndDomains.jsx - CRUD de servidores
 * 
 * @module Backend Route
 * @category Infrastructure
 * @path /backend/src/routes/servers.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { validateParams } from '../middleware/validate.js'
import { ParamIdSchema } from '../validation/schemas.js'

const router = Router()

// GET /servers
router.get('/', authRequired, requireMaster, async (req, res) => {
    const servers = await prisma.serverNode.findMany({
        orderBy: { name: 'asc' }
    })
    res.json(servers)
})

// POST /servers
router.post('/', authRequired, requireMaster, async (req, res) => {
    try {
        const data = req.body
        const server = await prisma.serverNode.create({
            data: {
                name: data.name,
                ipAddress: data.ipAddress,
                location: data.location || 'Unknown',
                status: data.status || 'ACTIVE',
                provider: data.provider,
                size: data.size,
                costMonthly: data.costMonthly ? Number(data.costMonthly) : 0,
                costAnnual: data.costAnnual ? Number(data.costAnnual) : 0,
                nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : null,
                billingCycle: data.billingCycle || 'MONTHLY',
                capacity: Number(data.capacity) || 100
            }
        })
        res.status(201).json(server)
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Server name/IP already exists' })
        res.status(400).json({ error: e.message })
    }
})

// PUT /servers/:id
router.put('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        const data = req.body
        const server = await prisma.serverNode.update({
            where: { id },
            data: {
                name: data.name,
                ipAddress: data.ipAddress,
                location: data.location,
                status: data.status,
                provider: data.provider,
                size: data.size,
                costMonthly: data.costMonthly !== undefined ? Number(data.costMonthly) : undefined,
                costAnnual: data.costAnnual !== undefined ? Number(data.costAnnual) : undefined,
                nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : undefined,
                capacity: data.capacity ? Number(data.capacity) : undefined
            }
        })
        res.json(server)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// DELETE
router.delete('/:id', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        await prisma.serverNode.delete({ where: { id } })
        res.status(204).end()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router
