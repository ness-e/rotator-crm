/**
 * @file domains.js
 * @description Definición de rutas API para el módulo domains.
 * @module Backend Route
 * @path /backend/src/routes/domains.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * Domains CRUD Routes
 */

// List all domains
router.get('/', authRequired, async (req, res) => {
    try {
        const domains = await prisma.domain.findMany({
            orderBy: { createdAt: 'desc' }
        })
        res.json(domains)
    } catch (error) {
        console.error('Error fetching domains:', error)
        res.status(500).json({ error: 'Error fetching domains' })
    }
})

// Get single domain
router.get('/:id', authRequired, async (req, res) => {
    try {
        const domain = await prisma.domain.findUnique({
            where: { id: parseInt(req.params.id) }
        })
        if (!domain) return res.status(404).json({ error: 'Domain not found' })
        res.json(domain)
    } catch (error) {
        console.error('Error fetching domain:', error)
        res.status(500).json({ error: 'Error fetching domain' })
    }
})

// Create domain
router.post('/', authRequired, async (req, res) => {
    try {
        const { domain_name, server_id, status, expires_at, observations } = req.body

        if (!domain_name) {
            return res.status(400).json({ error: 'Domain name is required' })
        }

        const domain = await prisma.domain.create({
            data: {
                domain_name,
                server_id: server_id ? parseInt(server_id) : null,
                status: status || 'active',
                expires_at: expires_at ? new Date(expires_at) : null,
                observations
            }
        })
        res.status(201).json(domain)
    } catch (error) {
        console.error('Error creating domain:', error)
        res.status(500).json({ error: 'Error creating domain' })
    }
})

// Update domain
router.put('/:id', authRequired, async (req, res) => {
    try {
        const { domain_name, server_id, status, expires_at, observations } = req.body
        const domain = await prisma.domain.update({
            where: { id: parseInt(req.params.id) },
            data: {
                domain_name,
                server_id: server_id ? parseInt(server_id) : null,
                status,
                expires_at: expires_at ? new Date(expires_at) : null,
                observations
            }
        })
        res.json(domain)
    } catch (error) {
        console.error('Error updating domain:', error)
        res.status(500).json({ error: 'Error updating domain' })
    }
})

// Delete domain
router.delete('/:id', authRequired, async (req, res) => {
    try {
        await prisma.domain.delete({
            where: { id: parseInt(req.params.id) }
        })
        res.json({ message: 'Domain deleted' })
    } catch (error) {
        console.error('Error deleting domain:', error)
        res.status(500).json({ error: 'Error deleting domain' })
    }
})

export default router
