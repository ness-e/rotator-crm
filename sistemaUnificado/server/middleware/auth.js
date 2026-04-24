/**
 * @file auth.js
 * @description JWT authentication middleware and token management
 * 
 * @overview
 * This middleware provides JWT-based authentication for the application. Handles
 * token generation (access + refresh), verification, and request authentication.
 * All protected routes use authRequired middleware to validate JWT tokens.
 * 
 * @features
 * - JWT access token generation (1 hour expiry)
 * - JWT refresh token generation (7 days expiry)
 * - Token verification and validation
 * - Request authentication middleware
 * - User payload extraction from JWT
 * 
 * @token-payload
 * JWT tokens contain:
 * - id: User or Organization ID
 * - email: User/Organization email
 * - role: SUPER_ADMIN, ADMIN, or MEMBER
 * - tipo: 'USER' or 'ORGANIZATION'
 * - nombre: User name (from nombre_cliente)
 * - isMaster: Boolean (for organizations)
 * 
 * @usage
 * ```javascript
 * import { signToken, signRefreshToken, authRequired } from './middleware/auth.js';
 * 
 * // Generate tokens on login
 * const accessToken = signToken({ id: user.id, email: user.email, role: user.role });
 * const refreshToken = signRefreshToken({ id: user.id });
 * 
 * // Protect routes
 * router.get('/protected', authRequired, (req, res) => {
 *   console.log(req.user); // JWT payload
 *   res.json({ user: req.user });
 * });
 * 
 * // Verify refresh token
 * const payload = verifyRefreshToken(refreshToken);
 * ```
 * 
 * @security-notes
 * - JWT_SECRET should be strong and stored in environment variables
 * - Access tokens expire in 1 hour (short-lived for security)
 * - Refresh tokens expire in 7 days (for session persistence)
 * - Tokens are sent via Authorization: Bearer header
 * - Invalid/expired tokens return 401 Unauthorized
 * 
 * @environment-variables
 * - JWT_SECRET: Secret key for signing tokens (default: 'dev-secret')
 * 
 * @dependencies
 * - jsonwebtoken - JWT generation and verification
 * 
 * @related-files
 * - backend/src/routes/auth.js - Uses signToken for login
 * - backend/src/routes/*.js - All protected routes use authRequired
 * - frontend/src/layouts/AdminLayout.jsx - Sends Authorization header
 * 
 * @module auth.middleware
 * @path /backend/src/middleware/auth.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
