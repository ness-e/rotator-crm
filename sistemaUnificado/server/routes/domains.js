/**
 * @file domains.js
 * @description Definición de rutas API para el módulo domains.
 * @module Backend Route
 * @path /backend/src/routes/domains.js
 * @lastUpdated 2026-03-26
 * @author Antigravity
 */

import express from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { encrypt, decrypt } from '../utils/crypto.js'

const router = express.Router()

/**
 * Domains CRUD Routes
 */

// List all domains
router.get('/', authRequired, async (req, res) => {
    try {
        const domains = await prisma.domain.findMany({
            orderBy: { createdAt: 'desc' },
            include: { server: true }
        })
        const cleanDomains = domains.map(d => {
            const { ftpPassword, ...rest } = d
            return { ...rest, hasFtpPassword: !!ftpPassword }
        })
        res.json(cleanDomains)
    } catch (error) {
        console.error('Error fetching domains:', error)
        res.status(500).json({ error: 'Error fetching domains' })
    }
})

// Get single domain
router.get('/:id', authRequired, async (req, res) => {
    try {
        const domain = await prisma.domain.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { server: true }
        })
        if (!domain) return res.status(404).json({ error: 'Domain not found' })
        
        const { ftpPassword, ...rest } = domain
        res.json({ ...rest, hasFtpPassword: !!ftpPassword })
    } catch (error) {
        console.error('Error fetching domain:', error)
        res.status(500).json({ error: 'Error fetching domain' })
    }
})

// Reveal decrypted FTP password
router.get('/:id/ftp-password', authRequired, async (req, res) => {
    try {
        const domain = await prisma.domain.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { ftpPassword: true }
        })
        if (!domain) return res.status(404).json({ error: 'Domain not found' })
        if (!domain.ftpPassword) return res.json({ password: null })

        const decrypted = decrypt(domain.ftpPassword)
        res.json({ password: decrypted || null })
    } catch (error) {
        console.error('Error revealing password:', error)
        res.status(500).json({ error: 'Error revealing password' })
    }
})

// Health check: probe the domain URL to see if it responds
router.get('/:id/health', authRequired, async (req, res) => {
    try {
        const domain = await prisma.domain.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { id: true, domainName: true }
        })
        if (!domain) return res.status(404).json({ error: 'Domain not found' })

        let url = domain.domainName.trim()
        // Ensure it has a protocol
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url
        }

        const start = Date.now()
        let healthy = false
        let statusCode = null
        let errorMessage = null

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 7000)

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                redirect: 'follow',
                headers: { 'User-Agent': 'RotatorHealthCheck/1.0' }
            })
            clearTimeout(timeoutId)

            statusCode = response.status
            // 2xx and 3xx = healthy
            healthy = statusCode >= 200 && statusCode < 400
        } catch (err) {
            if (err.name === 'AbortError') {
                errorMessage = 'Timeout (7s)'
            } else {
                // Try with http:// if https fails
                try {
                    const httpUrl = url.replace(/^https:\/\//i, 'http://')
                    const controller2 = new AbortController()
                    const timeoutId2 = setTimeout(() => controller2.abort(), 5000)

                    const response2 = await fetch(httpUrl, {
                        method: 'GET',
                        signal: controller2.signal,
                        redirect: 'follow',
                        headers: { 'User-Agent': 'RotatorHealthCheck/1.0' }
                    })
                    clearTimeout(timeoutId2)
                    statusCode = response2.status
                    healthy = statusCode >= 200 && statusCode < 400
                } catch (err2) {
                    errorMessage = err2.message || 'Connection failed'
                }
            }
        }

        const latencyMs = Date.now() - start

        res.json({
            domainId: domain.id,
            healthy,
            statusCode,
            latencyMs,
            errorMessage,
            checkedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error checking domain health:', error)
        res.status(500).json({ error: 'Error checking domain health' })
    }
})

// Create domain
router.post('/', authRequired, async (req, res) => {
    try {
        const { domainName, serverId, status, expiresAt, observations, isPropio, appName, ftpAddress, ftpUser, ftpPassword } = req.body

        if (!domainName) {
            return res.status(400).json({ error: 'Domain name is required' })
        }

        let encryptedPassword = null;
        if (ftpPassword) {
            encryptedPassword = encrypt(ftpPassword);
        }

        const domain = await prisma.domain.create({
            data: {
                domainName,
                serverId: serverId ? parseInt(serverId) : null,
                status: status || 'active',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                observations,
                isPropio: !!isPropio,
                appName: appName || null,
                ftpAddress: ftpAddress || null,
                ftpUser: ftpUser || null,
                ftpPassword: encryptedPassword
            }
        })
        // Omit the password in response
        const { ftpPassword: _, ...rest } = domain
        res.status(201).json({ ...rest, hasFtpPassword: !!encryptedPassword })
    } catch (error) {
        console.error('Error creating domain:', error)
        res.status(500).json({ error: 'Error creating domain: ' + error.message })
    }
})

// Update domain
router.put('/:id', authRequired, async (req, res) => {
    try {
        const { domainName, serverId, status, expiresAt, observations, isPropio, appName, ftpAddress, ftpUser, ftpPassword } = req.body
        
        let dataToUpdate = {
            domainName,
            serverId: serverId ? parseInt(serverId) : null,
            status,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            observations,
            isPropio: isPropio !== undefined ? !!isPropio : undefined,
            appName: appName || null,
            ftpAddress: ftpAddress || null,
            ftpUser: ftpUser || null,
        }

        if (ftpPassword !== undefined) {
            if (ftpPassword === '') {
                dataToUpdate.ftpPassword = null;
            } else {
                dataToUpdate.ftpPassword = encrypt(ftpPassword);
            }
        }

        const domain = await prisma.domain.update({
            where: { id: parseInt(req.params.id) },
            data: dataToUpdate
        })
        const { ftpPassword: _, ...rest } = domain
        res.json({ ...rest, hasFtpPassword: !!domain.ftpPassword })
    } catch (error) {
        console.error('Error updating domain:', error)
        res.status(500).json({ error: 'Error updating domain: ' + error.message })
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
