/**
 * @file audit.service.js
 * @description Audit logging service for tracking all system actions
 * 
 * @overview
 * This service provides comprehensive audit logging functionality, recording all
 * significant user actions in the system. Logs are stored in the AuditLog table
 * and can be viewed through the Admin Audit interface.
 * 
 * @features
 * - Action logging with Spanish translations
 * - Automatic user information extraction from JWT
 * - IP address normalization and tracking
 * - Detailed action metadata storage
 * - Error-resilient logging (failures don't break operations)
 * 
 * @action-types
 * - CREATE (CREAR) - Entity creation
 * - UPDATE (MODIFICAR) - Entity modification
 * - DELETE (ELIMINAR) - Entity deletion
 * - LOGIN (SESIÓN INICIADA) - User login
 * - REGENERATE (REGENERAR CLAVE) - License key regeneration
 * 
 * @usage
 * ```javascript
 * import { logAction } from './audit.service.js';
 * 
 * // Log with request object (auto-extracts user info)
 * await logAction({
 *   req,
 *   action: 'CREATE',
 *   entity: 'User',
 *   entityId: newUser.id,
 *   entityName: newUser.email,
 *   details: { role: newUser.role }
 * });
 * 
 * // Log with explicit user info
 * await logAction({
 *   userId: 123,
 *   userEmail: 'admin@example.com',
 *   userName: 'Admin User',
 *   action: 'DELETE',
 *   entity: 'License',
 *   entityId: '456',
 *   details: 'Expired license removed',
 *   ip: '192.168.1.1'
 * });
 * ```
 * 
 * @parameters
 * @param {Object} options - Logging options
 * @param {number} [options.userId] - User ID (auto-extracted from req.user if not provided)
 * @param {string} [options.userEmail] - User email (auto-extracted from req.user if not provided)
 * @param {string} [options.userName] - User name (auto-extracted from req.user.nombre if not provided)
 * @param {string} options.action - Action type (CREATE, UPDATE, DELETE, LOGIN, REGENERATE)
 * @param {string} options.entity - Entity type (User, License, Organization, etc.)
 * @param {string|number} [options.entityId] - Entity ID
 * @param {string} [options.entityName] - Entity name for display
 * @param {Object|string} [options.details] - Additional details (auto-stringified if object)
 * @param {string} [options.ip] - IP address (auto-extracted from req if not provided)
 * @param {Object} [options.req] - Express request object (for auto-extraction)
 * 
 * @dependencies
 * - prisma (config/prismaClient.js) - Database client for AuditLog table
 * 
 * @database-schema
 * ```prisma
 * model AuditLog {
 *   id        Int      @id @default(autoincrement())
 *   userId    Int?
 *   action    String   // Spanish translated action
 *   entity    String   // Entity type
 *   entityId  String   // Entity ID
 *   details   String   // JSON or text details
 *   ip        String   // Normalized IP address
 *   createdAt DateTime @default(now())
 * }
 * ```
 * 
 * @related-files
 * - backend/src/routes/*.js - All routes use logAction for audit trail
 * - backend/src/middleware/auth.js - Provides req.user for auto-extraction
 * - frontend/src/pages/AdminAudit.jsx - Displays audit logs
 * 
 * @module audit.service
 * @path /backend/src/services/audit.service.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { prisma } from '../config/prismaClient.js'

const ACTION_MAP = {
    'CREATE': 'CREAR',
    'UPDATE': 'MODIFICAR',
    'DELETE': 'ELIMINAR',
    'LOGIN': 'SESIÓN INICIADA',
    'REGENERATE': 'REGENERAR CLAVE'
}

export const logAction = async ({ userId, userEmail, userName, action, entity, entityId, entityName, details, ip, req }) => {
    try {
        if (req) {
            if (!userId && req.user) userId = req.user.id
            if (!userEmail && req.user) userEmail = req.user.email
            if (!userName && req.user) {
                // JWT payload has: { id, tipo, nombre, email }
                // where 'nombre' comes from user.nombre_cliente
                userName = req.user.nombre || req.user.email?.split('@')[0] || 'Sistema'
            }
            if (!ip) ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress

            // Normalize IP
            if (ip === '::1') ip = '127.0.0.1'
            if (ip && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '')
        }

        // Translate Action
        const spanishAction = ACTION_MAP[action] || action

        await prisma.auditLog.create({
            data: {
                userId: userId ? Number(userId) : null,
                userEmail: userEmail ? String(userEmail) : null,
                userName: userName ? String(userName) : null,
                action: String(spanishAction),
                entity: String(entity),
                entityId: String(entityId || ''),
                entityName: entityName ? String(entityName) : null,
                details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
                ip: String(ip || '0.0.0.0')
            }
        })
        console.log(`>>> AUDIT SUCCESS: ${spanishAction} on ${entity} (${userName})`)
    } catch (error) {
        console.error('!!! AUDIT LOG FAILED !!!')
        console.error('Error details:', error)
    }
}
