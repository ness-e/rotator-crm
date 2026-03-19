/**
 * @file roles.js
 * @description Role-based access control (RBAC) middleware
 * 
 * @overview
 * This middleware provides role-based authorization for protected routes. Currently
 * implements requireMaster middleware to restrict access to SUPER_ADMIN and MASTER
 * users/organizations only.
 * 
 * @features
 * - Master/Admin role verification
 * - Supports both User and Organization roles
 * - 403 Forbidden on unauthorized access
 * - Compatible with legacy 'tipo' field and new 'role' field
 * 
 * @roles-supported
 * - SUPER_ADMIN: Full system access (User role)
 * - MASTER: Legacy master role (User tipo or Organization isMaster)
 * - ADMIN: Organization admin (User role)
 * - MEMBER: Regular user (User role)
 * 
 * @usage
 * ```javascript
 * import { requireMaster } from './middleware/roles.js';
 * import { authRequired } from './middleware/auth.js';
 * 
 * // Protect admin-only routes
 * router.get('/admin/users', authRequired, requireMaster, (req, res) => {
 *   // Only SUPER_ADMIN and MASTER can access
 * });
 * 
 * // Chain with other middleware
 * router.delete('/admin/organizations/:id', 
 *   authRequired, 
 *   requireMaster, 
 *   deleteOrganization
 * );
 * ```
 * 
 * @req-user-structure
 * Expects req.user to have:
 * - role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
 * - tipo: 'MASTER' | 'USER' (legacy field)
 * 
 * @future-enhancements
 * - Add requireAdmin middleware
 * - Add requireRole(role) generic middleware
 * - Add permission-based authorization
 * - Add organization-scoped permissions
 * 
 * @dependencies
 * - None (pure middleware)
 * 
 * @related-files
 * - backend/src/middleware/auth.js - Provides req.user
 * - backend/src/routes/*.js - Admin routes use requireMaster
 * - backend/prisma/schema.prisma - Role enum definition
 * 
 * @module roles.middleware
 * @path /backend/src/middleware/roles.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export function requireMaster(req, res, next) {
  if (!req.user || (req.user.tipo !== 'MASTER' && req.user.role !== 'MASTER' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
