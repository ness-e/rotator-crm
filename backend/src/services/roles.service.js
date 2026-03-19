/**
 * @file roles.service.js
 * @description Role initialization service (deprecated - using static roles)
 * 
 * @overview
 * This service was originally designed for dynamic role management but has been
 * deprecated in V2. The system now uses hardcoded static roles defined in the
 * User schema: 'SUPER_ADMIN', 'ADMIN', 'MEMBER'.
 * 
 * @deprecation-note
 * Dynamic Role table was removed in V2 schema migration. Roles are now static
 * enums in the Prisma schema for better type safety and simpler management.
 * 
 * @current-roles
 * - SUPER_ADMIN: Full system access, can manage all organizations
 * - ADMIN: Organization admin, can manage users and licenses
 * - MEMBER: Regular user, limited access
 * 
 * @usage
 * ```javascript
 * import { initRoles } from './roles.service.js';
 * 
 * // Called on server startup (no-op in V2)
 * await initRoles();
 * ```
 * 
 * @migration-history
 * - V1: Used dynamic Role table with permissions
 * - V2: Migrated to static enum roles in User schema
 * - Current: This service exists for backward compatibility only
 * 
 * @related-files
 * - backend/prisma/schema.prisma - User model with Role enum
 * - backend/src/middleware/auth.js - Role-based access control
 * 
 * @module roles.service
 * @path /backend/src/services/roles.service.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export const initRoles = async () => {
    // V2 uses hardcoded 'MASTER' | 'USER' roles in User schema.
    // Dynamic Role table was deprecated.
    console.log('✅ Roles static check skipped (V2 Schema)');
}
