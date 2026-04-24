/**
 * @file backup.js
 * @description Definición de rutas API para el módulo backup.
 * @module Backend Route
 * @path /backend/src/routes/backup.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import { BackupService } from '../services/backup.service.js'
import { authRequired as requireAuth } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { logAction } from '../services/audit.service.js'

const router = Router()
const upload = multer({ dest: 'uploads/' })

// GET /backup/download - Download current DB
router.get('/download', requireAuth, requireMaster, async (req, res) => {
    try {
        const dbPath = BackupService.getDbPath()
        if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'DB not found' })

        const date = new Date().toISOString().slice(0, 10)
        res.download(dbPath, `rotator-backup-${date}.sqlite`, (err) => {
            if (err) console.error('Error downloading:', err)
            else {
                logAction({
                    req,
                    action: 'BACKUP_DOWNLOAD',
                    entity: 'System',
                    entityId: 'DB',
                    entityName: 'Database',
                    details: 'Respaldo de base de datos descargado'
                })
            }
        })
    } catch (e) {
        res.status(500).json({ error: 'Available backup failed' })
    }
})

// POST /backup/restore - Upload and restore DB
router.post('/restore', requireAuth, requireMaster, upload.single('backup'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    try {
        // Basic validation: Check magic header for SQLite "SQLite format 3"
        // const buffer = fs.readFileSync(req.file.path, { encoding: 'utf8', start: 0, end: 15 })
        // if (!buffer.startsWith('SQLite format 3')) ...

        await BackupService.restoreBackup(req.file.path)

        // Cleanup upload
        fs.unlinkSync(req.file.path)

        logAction({
            req,
            action: 'BACKUP_RESTORE',
            entity: 'System',
            entityId: 'DB',
            entityName: 'Database',
            details: 'Base de datos restaurada desde archivo'
        })

        res.json({ message: 'Database restored successfully' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Restore failed' })
    }
})

export default router
