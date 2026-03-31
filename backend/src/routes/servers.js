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

// Global monitor token (set in .env as MONITOR_SECRET_TOKEN)
const MONITOR_SECRET_TOKEN = process.env.MONITOR_SECRET_TOKEN || 'ROTATOR_MONITOR_2026_CHANGE_ME'

// GET /servers
router.get('/', authRequired, requireMaster, async (req, res) => {
    const servers = await prisma.serverNode.findMany({
        include: {
            providerRef: true,
            providerPlan: true,
            organization: {
                select: { id: true, name: true }
            },
            domains: true,
            licenseServers: {
                include: { license: true }
            }
        },
        orderBy: { name: 'asc' }
    })
    res.json(servers)
})

// GET /servers/costs
router.get('/costs', authRequired, requireMaster, async (req, res) => {
    try {
        const servers = await prisma.serverNode.findMany({
            include: { providerRef: true }
        })
        
        let totalMonthly = 0
        let totalAnnual = 0
        const byProvider = {}
        const bySize = {}
        
        servers.forEach(s => {
            if (s.costMonthly) totalMonthly += Number(s.costMonthly)
            if (s.costAnnual) totalAnnual += Number(s.costAnnual)
            
            const prov = s.providerRef?.name || 'UNKNOWN'
            const sz = s.size || 'UNKNOWN'
            
            byProvider[prov] = (byProvider[prov] || 0) + Number(s.costMonthly || 0)
            bySize[sz] = (bySize[sz] || 0) + Number(s.costMonthly || 0)
        })
        
        const providerData = Object.entries(byProvider).map(([name, value]) => ({ name, value }))
        const sizeData = Object.entries(bySize).map(([name, value]) => ({ name, value }))
        
        res.json({ totalMonthly, totalAnnual, providerData, sizeData })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// GET /servers/expiring
router.get('/expiring', authRequired, requireMaster, async (req, res) => {
    try {
        const now = new Date()
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        const servers = await prisma.serverNode.findMany({
            where: {
                nextPaymentDate: {
                    gte: now,
                    lte: thirtyDays
                }
            },
            orderBy: { nextPaymentDate: 'asc' }
        })
        res.json(servers)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// GET /servers/:id/diagnostics
// Proxies the request to the remote monitorServer.php and returns its JSON
router.get('/:id/diagnostics', authRequired, requireMaster, validateParams(ParamIdSchema), async (req, res) => {
    const id = Number(req.validated.params.id)
    try {
        const server = await prisma.serverNode.findUnique({ where: { id } })
        if (!server) return res.status(404).json({ error: 'Server not found' })
        if (!server.primaryDomain) {
            return res.status(400).json({ error: 'Server has no primaryDomain configured. Please set a primary domain to enable diagnostics.' })
        }

        // Build the monitor URL
        const domain = server.primaryDomain.replace(/\/+$/, '') // strip trailing slash
        const monitorUrl = `https://${domain}/tests/monitorServer.php?token=${encodeURIComponent(MONITOR_SECRET_TOKEN)}`

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        try {
            const response = await fetch(monitorUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            })
            clearTimeout(timeout)

            if (!response.ok) {
                const text = await response.text()
                return res.status(502).json({
                    error: `Monitor script responded with HTTP ${response.status}`,
                    detail: text.substring(0, 500)
                })
            }

            const data = await response.json()
            return res.json(data)
        } catch (fetchErr) {
            clearTimeout(timeout)
            if (fetchErr.name === 'AbortError') {
                return res.status(504).json({ error: 'Diagnostics request timed out after 30 seconds' })
            }
            return res.status(502).json({ error: `Cannot reach monitor script: ${fetchErr.message}` })
        }
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// GET /servers/by-organization/:orgId
import { z } from 'zod';
router.get('/by-organization/:orgId', authRequired, requireMaster, validateParams(z.object({ orgId: z.coerce.number().int().positive() })), async (req, res) => {
    try {
        const orgId = Number(req.params.orgId)
        const servers = await prisma.serverNode.findMany({
            where: { organizationId: orgId },
            include: {
                providerRef: true,
                providerPlan: true,
                domains: true,
                licenseServers: {
                    include: { license: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        res.json(servers)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// POST /servers
router.post('/', authRequired, requireMaster, async (req, res) => {
    try {
        const data = req.body
        const server = await prisma.serverNode.create({
            data: {
                name: data.name,
                ipAddress: data.ipAddress,
                type: data.type,
                status: data.status || 'active',
                providerId: data.providerId ? Number(data.providerId) : null,
                providerPlanId: data.providerPlanId ? Number(data.providerPlanId) : null,
                organizationId: data.organizationId ? Number(data.organizationId) : null,
                size: data.size || null,
                costMonthly: data.costMonthly ? Number(data.costMonthly) : 0,
                costAnnual: data.costAnnual ? Number(data.costAnnual) : 0,
                currency: data.currency || 'USD',
                billingCycle: data.billingCycle || 'MONTHLY',
                nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : null,
                capacity: Number(data.capacity) || 100,
                observations: data.observations || null,
                primaryDomain: data.primaryDomain || null,
            },
            include: { providerRef: true, providerPlan: true, organization: true }
        })
        res.status(201).json(server)
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Server name/IP or primary domain already exists' })
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
                type: data.type,
                status: data.status,
                providerId: data.providerId !== undefined ? (data.providerId ? Number(data.providerId) : null) : undefined,
                providerPlanId: data.providerPlanId !== undefined ? (data.providerPlanId ? Number(data.providerPlanId) : null) : undefined,
                organizationId: data.organizationId !== undefined ? (data.organizationId ? Number(data.organizationId) : null) : undefined,
                size: data.size !== undefined ? (data.size || null) : undefined,
                costMonthly: data.costMonthly !== undefined ? Number(data.costMonthly) : undefined,
                costAnnual: data.costAnnual !== undefined ? Number(data.costAnnual) : undefined,
                currency: data.currency || undefined,
                billingCycle: data.billingCycle || undefined,
                nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : null,
                capacity: data.capacity ? Number(data.capacity) : undefined,
                observations: data.observations !== undefined ? (data.observations || null) : undefined,
                primaryDomain: data.primaryDomain !== undefined ? (data.primaryDomain || null) : undefined,
            },
            include: { providerRef: true, providerPlan: true, organization: true }
        })
        res.json(server)
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Primary domain already in use by another server' })
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
