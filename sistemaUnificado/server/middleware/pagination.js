/**
 * @file pagination.js
 * @description Pagination middleware and helper functions for API responses
 * 
 * @overview
 * This middleware provides automatic pagination parsing from query parameters and
 * helper functions to create standardized paginated responses. Ensures consistent
 * pagination across all API endpoints.
 * 
 * @features
 * - Automatic query parameter parsing (page, limit)
 * - Safe bounds checking (min/max values)
 * - Skip/take calculation for Prisma
 * - Standardized paginated response format
 * - Metadata: total pages, hasNext, hasPrev
 * 
 * @usage
 * ```javascript
 * import { paginationMiddleware, paginatedResponse } from './middleware/pagination.js';
 * 
 * // Apply middleware to route
 * router.get('/api/users', paginationMiddleware, async (req, res) => {
 *   const { skip, take } = req.pagination;
 *   
 *   const users = await prisma.user.findMany({
 *     skip,
 *     take,
 *   });
 *   
 *   const total = await prisma.user.count();
 *   
 *   res.json(paginatedResponse(users, total, req.pagination));
 * });
 * ```
 * 
 * @query-parameters
 * - page: Page number (default: 1, min: 1)
 * - limit: Items per page (default: 20, min: 1, max: 100)
 * 
 * @req-pagination-object
 * Middleware adds req.pagination with:
 * - page: Current page number
 * - limit: Items per page
 * - skip: Number of items to skip (for Prisma)
 * - take: Number of items to take (for Prisma)
 * 
 * @response-format
 * paginatedResponse returns:
 * ```json
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 150,
 *     "totalPages": 8,
 *     "hasNext": true,
 *     "hasPrev": false
 *   }
 * }
 * ```
 * 
 * @example-requests
 * ```
 * GET /api/users?page=1&limit=20  // First page, 20 items
 * GET /api/users?page=2&limit=50  // Second page, 50 items
 * GET /api/users                  // Default: page=1, limit=20
 * ```
 * 
 * @safety-features
 * - Page minimum: 1 (negative pages become 1)
 * - Limit minimum: 1
 * - Limit maximum: 100 (prevents excessive data transfer)
 * - Invalid values default to safe values
 * 
 * @prisma-integration
 * Works seamlessly with Prisma:
 * ```javascript
 * const { skip, take } = req.pagination;
 * const data = await prisma.model.findMany({ skip, take });
 * ```
 * 
 * @dependencies
 * - None (pure JavaScript)
 * 
 * @related-files
 * - backend/src/routes/*.js - All list endpoints can use pagination
 * - frontend/src/components/DataTable.jsx - Consumes paginated responses
 * 
 * @module pagination.middleware
 * @path /backend/src/middleware/pagination.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export function paginationMiddleware(req, res, next) {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const skip = (page - 1) * limit

  req.pagination = {
    page,
    limit,
    skip,
    take: limit
  }

  next()
}

/**
 * Helper para crear respuesta paginada
 */
export function paginatedResponse(data, total, pagination) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1
    }
  }
}
