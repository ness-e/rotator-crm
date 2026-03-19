/**
 * @file permissions.js
 * @description Permission constants for role-based access control
 * 
 * @overview
 * This module defines permission constants used throughout the application for
 * fine-grained access control. Provides a centralized list of all permissions
 * that can be assigned to roles or checked in authorization logic.
 * 
 * @features
 * - Centralized permission constants
 * - Dot-notation naming convention (resource.action)
 * - ALL_PERMISSIONS array for iteration
 * - Type-safe permission references
 * 
 * @permission-categories
 * **Users:**
 * - users.view - View user list and details
 * - users.create - Create new users
 * - users.edit - Edit existing users
 * - users.delete - Delete users
 * 
 * **Licenses:**
 * - licenses.view - View license list and details
 * - licenses.create - Create new licenses
 * - licenses.edit - Edit existing licenses
 * - licenses.delete - Delete licenses
 * 
 * **System:**
 * - audit.view - View audit logs
 * - roles.manage - Manage roles and permissions
 * - settings.manage - Manage system settings
 * - stats.view - View statistics and metrics
 * 
 * @usage
 * ```javascript
 * import { PERMISSIONS, ALL_PERMISSIONS } from './config/permissions.js';
 * 
 * // Check permission in middleware
 * function requirePermission(permission) {
 *   return (req, res, next) => {
 *     if (!req.user.permissions.includes(permission)) {
 *       return res.status(403).json({ error: 'Forbidden' });
 *     }
 *     next();
 *   };
 * }
 * 
 * // Use in routes
 * router.get('/users', requirePermission(PERMISSIONS.USERS_VIEW), getUsers);
 * router.post('/users', requirePermission(PERMISSIONS.USERS_CREATE), createUser);
 * 
 * // Check multiple permissions
 * const hasAccess = [PERMISSIONS.USERS_VIEW, PERMISSIONS.LICENSES_VIEW]
 *   .every(p => user.permissions.includes(p));
 * ```
 * 
 * @naming-convention
 * Format: `RESOURCE_ACTION`
 * - RESOURCE: Plural noun (USERS, LICENSES, etc.)
 * - ACTION: Verb (VIEW, CREATE, EDIT, DELETE, MANAGE)
 * 
 * Value format: `resource.action` (lowercase, dot-separated)
 * 
 * @adding-permissions
 * To add new permissions:
 * 1. Add constant to PERMISSIONS object
 * 2. Follow naming convention
 * 3. Update role assignments if needed
 * 4. Document in this header
 * 
 * @current-implementation-status
 * ⚠️ **Note:** Permission system is defined but not fully implemented.
 * Current system uses role-based access (SUPER_ADMIN, ADMIN, MEMBER).
 * This module provides foundation for future permission-based RBAC.
 * 
 * @future-enhancements
 * - Implement permission checking middleware
 * - Add permission-role mappings
 * - Create permission assignment UI
 * - Add permission inheritance
 * - Implement resource-level permissions (e.g., "can edit own profile")
 * 
 * @dependencies
 * - None (pure constants)
 * 
 * @related-files
 * - backend/src/middleware/roles.js - Current role-based auth
 * - backend/prisma/schema.prisma - User/Role models
 * 
 * @module permissions.config
 * @path /backend/src/config/permissions.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export const PERMISSIONS = {
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',

    LICENSES_VIEW: 'licenses.view',
    LICENSES_CREATE: 'licenses.create',
    LICENSES_EDIT: 'licenses.edit',
    LICENSES_DELETE: 'licenses.delete',

    AUDIT_VIEW: 'audit.view',
    ROLES_MANAGE: 'roles.manage',
    SETTINGS_MANAGE: 'settings.manage',

    STATS_VIEW: 'stats.view',
}

export const ALL_PERMISSIONS = Object.values(PERMISSIONS)
