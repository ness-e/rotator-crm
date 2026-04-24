/**
 * @file backup.service.js
 * @description Database backup and restore service for SQLite database
 * 
 * @overview
 * This service provides functionality to create and restore backups of the SQLite
 * database. Backups are stored in the backend/backups directory with timestamps.
 * 
 * @features
 * - Create timestamped database backups
 * - Restore database from backup file
 * - Automatic safety backup before restore
 * - Backup directory auto-creation
 * 
 * @usage
 * ```javascript
 * import { BackupService } from './backup.service.js';
 * 
 * // Create a backup
 * const backupPath = await BackupService.createBackup();
 * console.log('Backup created at:', backupPath);
 * 
 * // Restore from backup (creates safety backup first)
 * await BackupService.restoreBackup('/path/to/backup.sqlite');
 * 
 * // Get database path
 * const dbPath = BackupService.getDbPath();
 * ```
 * 
 * @backup-naming
 * Backups are named with ISO timestamp format:
 * - Format: backup-YYYY-MM-DDTHH-MM-SS-mmmZ.sqlite
 * - Example: backup-2026-01-29T20-30-45-123Z.sqlite
 * 
 * @safety-features
 * - Creates safety backup before restore operations
 * - Ensures backup directory exists before operations
 * - Uses file system copy (preserves original)
 * 
 * @dependencies
 * - fs/promises - For async file operations
 * - path - For path manipulation
 * - audit.service.js - For logging backup operations
 * 
 * @related-files
 * - backend/src/routes/backup.js - API endpoints for backup/restore
 * - frontend/src/pages/Configuracion.jsx - UI for backup management
 * - backend/prisma/rotator.db - The database being backed up
 * 
 * @module backup.service
 * @path /backend/src/services/backup.service.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { logAction } from './audit.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../../prisma/rotator.db')
const BACKUP_DIR = path.join(__dirname, '../../backups')

// Ensure backup dir exists
async function ensureDir() {
    try { await fs.access(BACKUP_DIR) }
    catch { await fs.mkdir(BACKUP_DIR, { recursive: true }) }
}

export const BackupService = {
    async createBackup() {
        await ensureDir()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `backup-${timestamp}.sqlite`
        const dest = path.join(BACKUP_DIR, filename)

        // Copy existing DB
        await fs.copyFile(DB_PATH, dest)
        return dest
    },

    async restoreBackup(filePath) {
        // Create a safety backup of current state
        await this.createBackup()

        // Replace DB
        await fs.copyFile(filePath, DB_PATH)
        return true
    },

    getDbPath() {
        return DB_PATH
    }
}
