/**
 * @file settings.service.js
 * @description System settings initialization and management service
 * 
 * @overview
 * This service initializes default system settings in the database on server startup.
 * Settings are stored in the SystemSetting table and can be modified through the admin
 * interface. Uses upsert to avoid overwriting existing settings.
 * 
 * @features
 * - Initialize default system settings
 * - Preserve existing settings (no overwrite)
 * - Organized by setting groups (GENERAL, SECURITY)
 * - Key-value storage with descriptions
 * 
 * @default-settings
 * **GENERAL Group:**
 * - site_name: "Rotator Survey"
 * - site_description: "Sistema de Gestión de Licencias"
 * - support_email: "soporte@rotatorsurvey.com"
 * 
 * **SECURITY Group:**
 * - maintenance_mode: "false" (true/false)
 * - password_policy: "medium" (low, medium, high)
 * - session_timeout: "3600" (seconds)
 * 
 * @usage
 * ```javascript
 * import { initSettings } from './settings.service.js';
 * 
 * // Called on server startup
 * await initSettings();
 * ```
 * 
 * @database-schema
 * ```prisma
 * model SystemSetting {
 *   id          Int      @id @default(autoincrement())
 *   key         String   @unique
 *   value       String
 *   description String?
 *   group       String?
 *   createdAt   DateTime @default(now())
 *   updatedAt   DateTime @updatedAt
 * }
 * ```
 * 
 * @adding-settings
 * To add new settings, add to DEFAULT_SETTINGS array:
 * ```javascript
 * { 
 *   key: 'new_setting', 
 *   value: 'default_value', 
 *   description: 'Setting description', 
 *   group: 'GROUP_NAME' 
 * }
 * ```
 * 
 * @dependencies
 * - @prisma/client - Database client
 * 
 * @related-files
 * - backend/src/routes/settings.js - API endpoints for settings CRUD
 * - frontend/src/pages/AdminSettings.jsx - Settings management UI
 * - backend/src/index.js - Calls initSettings() on startup
 * 
 * @module settings.service
 * @path /backend/src/services/settings.service.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_SETTINGS = [
    { key: 'site_name', value: 'Rotator Survey', description: 'Nombre del sitio', group: 'GENERAL' },
    { key: 'site_description', value: 'Sistema de Gestión de Licencias', description: 'Descripción meta', group: 'GENERAL' },
    { key: 'support_email', value: 'soporte@rotatorsurvey.com', description: 'Email de soporte', group: 'GENERAL' },
    { key: 'maintenance_mode', value: 'false', description: 'Modo mantenimiento (true/false)', group: 'SECURITY' },
    { key: 'password_policy', value: 'medium', description: 'Política de contraseñas (low, medium, high)', group: 'SECURITY' },
    { key: 'session_timeout', value: '3600', description: 'Tiempo de sesión en segundos', group: 'SECURITY' },
]

export const initSettings = async () => {
    try {
        for (const setting of DEFAULT_SETTINGS) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: {}, // Don't overwrite existing
                create: setting
            })
        }
        console.log('✅ System settings initialized')
    } catch (error) {
        console.error('Error initializing settings:', error)
    }
}
