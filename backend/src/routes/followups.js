/**
 * @file followups.js
 * @description Definición de rutas API para el módulo followups.
 * @module Backend Route
 * @path /backend/src/routes/followups.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired as requireAuth } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'

const router = Router()
// Utiliza la instancia global de prisma importada arriba

// GET /followups - Get all follow-ups
router.get('/', requireAuth, requireMaster, async (req, res) => {
    try {
        const followUps = await prisma.followUp.findMany({
            include: { user: true },
            orderBy: { fecha: 'desc' }
        })
        res.json(followUps)
    } catch (error) {
        console.error('Error fetching follow-ups:', error)
        res.status(500).json({ error: 'Error fetching follow-ups' })
    }
})

// GET /followups/upcoming - Get upcoming follow-ups
router.get('/upcoming', requireAuth, requireMaster, async (req, res) => {
    try {
        const now = new Date()
        const followUps = await prisma.followUp.findMany({
            where: {
                fecha: {
                    gte: now
                }
            },
            include: { user: true },
            orderBy: { fecha: 'asc' },
            take: 20
        })
        res.json(followUps)
    } catch (error) {
        console.error('Error fetching upcoming follow-ups:', error)
        res.status(500).json({ error: 'Error fetching upcoming follow-ups' })
    }
})

// GET /followups/user/:id - Get follow-ups for specific user
router.get('/user/:id', requireAuth, requireMaster, async (req, res) => {
    try {
        const followUps = await prisma.followUp.findMany({
            where: { userId: Number(req.params.id) },
            include: { user: true },
            orderBy: { fecha: 'desc' }
        })
        res.json(followUps)
    } catch (error) {
        console.error('Error fetching user follow-ups:', error)
        res.status(500).json({ error: 'Error fetching user follow-ups' })
    }
})

// GET /followups/prospect/:id - Get follow-ups for specific prospect
router.get('/prospect/:id', requireAuth, requireMaster, async (req, res) => {
    try {
        const followUps = await prisma.followUp.findMany({
            where: { prospectId: Number(req.params.id) },
            include: { user: true },
            orderBy: { fecha: 'desc' }
        })
        res.json(followUps)
    } catch (error) {
        console.error('Error fetching prospect follow-ups:', error)
        res.status(500).json({ error: 'Error fetching prospect follow-ups' })
    }
})

// POST /followups - Create new follow-up
router.post('/', requireAuth, requireMaster, async (req, res) => {
    try {
        const data = {
            ...req.body,
            fecha: req.body.fecha ? new Date(req.body.fecha) : new Date()
        }

        const followUp = await prisma.followUp.create({
            data,
            include: { user: true }
        })

        res.status(201).json(followUp)
    } catch (error) {
        console.error('Error creating follow-up:', error)
        res.status(500).json({ error: 'Error creating follow-up' })
    }
})

// PUT /followups/:id - Update follow-up
router.put('/:id', requireAuth, requireMaster, async (req, res) => {
    try {
        const data = {
            ...req.body
        }
        if (req.body.fecha) {
            data.fecha = new Date(req.body.fecha)
        }

        const followUp = await prisma.followUp.update({
            where: { id: Number(req.params.id) },
            data,
            include: { user: true }
        })

        res.json(followUp)
    } catch (error) {
        console.error('Error updating follow-up:', error)
        res.status(500).json({ error: 'Error updating follow-up' })
    }
})

// DELETE /followups/:id - Delete follow-up
router.delete('/:id', requireAuth, requireMaster, async (req, res) => {
    try {
        await prisma.followUp.delete({
            where: { id: Number(req.params.id) }
        })

        res.json({ message: 'Follow-up deleted successfully' })
    } catch (error) {
        console.error('Error deleting follow-up:', error)
        res.status(500).json({ error: 'Error deleting follow-up' })
    }
})

export default router
