/**
 * @file validate.js
 * @description Zod-based request validation middleware
 * 
 * @overview
 * This middleware provides request validation using Zod schemas. Validates request
 * body and params before they reach route handlers, ensuring type safety and data
 * integrity. Returns detailed validation errors for debugging.
 * 
 * @features
 * - Request body validation (validateBody)
 * - Request params validation (validateParams)
 * - Detailed Zod error messages
 * - Type-safe validated data in req.validated
 * - 400 Bad Request on validation failure
 * 
 * @usage
 * ```javascript
 * import { validateBody, validateParams } from './middleware/validate.js';
 * import { z } from 'zod';
 * 
 * // Define schema
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(6),
 *   name: z.string().optional()
 * });
 * 
 * // Use in route
 * router.post('/users', validateBody(userSchema), (req, res) => {
 *   const { email, password, name } = req.validated.body;
 *   // Data is guaranteed to match schema
 * });
 * 
 * // Validate params
 * const idSchema = z.object({ id: z.string().regex(/^\d+$/) });
 * router.get('/users/:id', validateParams(idSchema), (req, res) => {
 *   const { id } = req.validated.params;
 * });
 * ```
 * 
 * @validated-data
 * Validated data is stored in req.validated:
 * - req.validated.body - Validated request body
 * - req.validated.params - Validated URL params
 * 
 * @error-response
 * On validation failure, returns:
 * ```json
 * {
 *   "error": "Validation error",
 *   "details": [
 *     {
 *       "path": ["email"],
 *       "message": "Invalid email"
 *     }
 *   ]
 * }
 * ```
 * 
 * @dependencies
 * - zod - Schema validation library
 * 
 * @related-files
 * - backend/src/routes/*.js - All routes use validation middleware
 * - backend/src/schemas/*.js - Zod schemas (if organized separately)
 * 
 * @module validate.middleware
 * @path /backend/src/middleware/validate.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { ZodError } from 'zod'

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validated = { ...(req.validated || {}), body: schema.parse(req.body) }
      next()
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: e.errors })
      }
      return res.status(400).json({ error: 'Bad request' })
    }
  }
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.validated = { ...(req.validated || {}), params: schema.parse(req.params) }
      next()
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: e.errors })
      }
      return res.status(400).json({ error: 'Bad request' })
    }
  }
}
