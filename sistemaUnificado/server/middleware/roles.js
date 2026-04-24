/**
 * @file roles.js
 * @description Role-based access control (RBAC) middleware
 * 
 * @roles
 * - MASTER: Full system control (Rotator Software only)
 * - ANALISTA: Read/write internal access (Rotator Software only)
 * - VISUALIZADOR: Read-only internal access (Rotator Software only)
 * - CLIENTE: External client access (customer organizations)
 * 
 * @module roles.middleware
 * @path /backend/src/middleware/roles.js
 * @lastUpdated 2026-03-20
 */

/** Only MASTER users can access */
export function requireMaster(req, res, next) {
  if (!req.user || (req.user.role !== 'MASTER' && req.user.tipo !== 'MASTER')) {
    return res.status(403).json({ error: 'Forbidden: MASTER role required' })
  }
  next()
}

/** MASTER or ANALISTA can access */
export function requireAnalyst(req, res, next) {
  const allowed = ['MASTER', 'ANALISTA']
  if (!req.user || (!allowed.includes(req.user.role) && req.user.tipo !== 'MASTER')) {
    return res.status(403).json({ error: 'Forbidden: ANALISTA or MASTER role required' })
  }
  next()
}

/** Any internal Rotator role (MASTER, ANALISTA, VISUALIZADOR) can access */
export function requireInternal(req, res, next) {
  const allowed = ['MASTER', 'ANALISTA', 'VISUALIZADOR']
  if (!req.user || (!allowed.includes(req.user.role) && req.user.tipo !== 'MASTER')) {
    return res.status(403).json({ error: 'Forbidden: Internal role required' })
  }
  next()
}
