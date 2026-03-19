/**
 * @file migration-clients.js
 * @description Definición de rutas API para el módulo migration-clients.
 * @module Backend Route
 * @path /backend/src/routes/migration-clients.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * Migration Clients CRUD Routes
 * For tracking clients pending migration
 */

// List all migration clients
router.get('/', authRequired, async (req, res) => {
    try {
        const clients = await prisma.migrationClient.findMany({
            orderBy: { createdAt: 'desc' }
        })
        res.json(clients)
    } catch (error) {
        console.error('Error fetching migration clients:', error)
        res.status(500).json({ error: 'Error fetching migration clients' })
    }
})

// Get single migration client
router.get('/:id', authRequired, async (req, res) => {
    try {
        const client = await prisma.migrationClient.findUnique({
            where: { id: parseInt(req.params.id) }
        })
        if (!client) return res.status(404).json({ error: 'Client not found' })
        res.json(client)
    } catch (error) {
        console.error('Error fetching migration client:', error)
        res.status(500).json({ error: 'Error fetching migration client' })
    }
})

// Create migration client
router.post('/', authRequired, async (req, res) => {
    try {
        const { empresa, contacto, correo, servidor, observations, status } = req.body

        if (!empresa) {
            return res.status(400).json({ error: 'Empresa is required' })
        }

        const client = await prisma.migrationClient.create({
            data: { empresa, contacto, correo, servidor, observations, status: status || 'pending' }
        })
        res.status(201).json(client)
    } catch (error) {
        console.error('Error creating migration client:', error)
        res.status(500).json({ error: 'Error creating migration client' })
    }
})

// Update migration client
router.put('/:id', authRequired, async (req, res) => {
    try {
        const { empresa, contacto, correo, servidor, observations, status } = req.body
        const client = await prisma.migrationClient.update({
            where: { id: parseInt(req.params.id) },
            data: { empresa, contacto, correo, servidor, observations, status }
        })
        res.json(client)
    } catch (error) {
        console.error('Error updating migration client:', error)
        res.status(500).json({ error: 'Error updating migration client' })
    }
})

// Delete migration client
router.delete('/:id', authRequired, async (req, res) => {
    try {
        await prisma.migrationClient.delete({
            where: { id: parseInt(req.params.id) }
        })
        res.json({ message: 'Migration client deleted' })
    } catch (error) {
        console.error('Error deleting migration client:', error)
        res.status(500).json({ error: 'Error deleting migration client' })
    }
})

// Update status (convenience endpoint)
router.patch('/:id/status', authRequired, async (req, res) => {
    try {
        const { status } = req.body
        const client = await prisma.migrationClient.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        })
        res.json(client)
    } catch (error) {
        console.error('Error updating migration client status:', error)
        res.status(500).json({ error: 'Error updating status' })
    }
})

export default router
