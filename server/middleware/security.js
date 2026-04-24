/**
 * @file security.js
 * @description Security middleware for rate limiting, XSS protection, and CSRF validation
 * 
 * @overview
 * This middleware provides multiple layers of security including rate limiting for
 * authentication and API endpoints, Helmet configuration for HTTP headers, input
 * sanitization, and origin validation for CSRF protection.
 * 
 * @features
 * - Rate limiting for auth endpoints (5 attempts / 15 min)
 * - Rate limiting for API endpoints (100 requests / 15 min)
 * - Helmet security headers (CSP, XSS protection, etc.)
 * - Input sanitization to prevent XSS
 * - Origin validation for CSRF protection
 * - Development/production mode awareness
 * 
 * @rate-limiters
 * **authRateLimiter:**
 * - Window: 15 minutes
 * - Max attempts: 5
 * - Use on: /api/auth/login, /api/auth/register
 * 
 * **apiRateLimiter:**
 * - Window: 15 minutes
 * - Max requests: 100
 * - Use on: All /api/* routes
 * 
 * @usage
 * ```javascript
 * import { authRateLimiter, apiRateLimiter, helmetConfig, validateOrigin } from './middleware/security.js';
 * 
 * // Apply globally
 * app.use(helmetConfig);
 * app.use('/api', apiRateLimiter);
 * 
 * // Protect auth routes
 * router.post('/auth/login', authRateLimiter, login);
 * 
 * // Validate origin on sensitive routes
 * router.post('/admin/*', validateOrigin, handler);
 * 
 * // Sanitize user input
 * const cleanName = sanitizeInput(req.body.name);
 * ```
 * 
 * @helmet-configuration
 * - Content Security Policy (CSP) configured
 * - Allows self, inline styles, data: and https: images
 * - Cross-Origin Embedder Policy disabled for compatibility
 * 
 * @origin-validation
 * Validates request origin against ALLOWED_ORIGINS:
 * - Development: Allows requests without origin (Postman, curl)
 * - Production: Strict origin validation required
 * - Default allowed: http://localhost:5173, http://localhost:3001
 * 
 * @environment-variables
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 * - NODE_ENV: 'development' or 'production'
 * 
 * @security-best-practices
 * - Always use HTTPS in production
 * - Set strong ALLOWED_ORIGINS in production
 * - Monitor rate limit violations
 * - Regularly update Helmet configuration
 * - Use CSRF tokens for state-changing operations
 * 
 * @dependencies
 * - express-rate-limit - Rate limiting
 * - helmet - Security headers
 * 
 * @related-files
 * - backend/src/index.js - Applies security middleware globally
 * - backend/src/routes/auth.js - Uses authRateLimiter
 * 
 * @module security.middleware
 * @path /backend/src/middleware/security.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

/**
 * Rate limiting para autenticación (más estricto)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Estricto en prod, relajado en dev
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiting general para API
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // 100 en prod, 10000 en dev
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Configuración de Helmet para seguridad
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

/**
 * Sanitizar inputs para prevenir XSS
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .trim()
}

/**
 * Validar origen de la petición (CSRF básico)
 */
export function validateOrigin(req, res, next) {
  const origin = req.get('origin')
  const referer = req.get('referer')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3001']

  // Permitir requests sin origin (Postman, curl, etc.) en desarrollo
  if (process.env.NODE_ENV === 'development' && !origin && !referer) {
    return next()
  }

  if (origin && allowedOrigins.includes(origin)) {
    return next()
  }

  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed))) {
    return next()
  }

  // En producción, rechazar requests sin origin válido
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden: Invalid origin' })
  }

  next()
}

