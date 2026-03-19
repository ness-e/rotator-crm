/**
 * @file cache.js
 * @description In-memory caching middleware for GET requests
 * 
 * @overview
 * This middleware provides simple in-memory caching for GET requests to improve
 * performance. Caches responses with configurable TTL and automatically cleans
 * expired entries. In production, should be replaced with Redis for distributed caching.
 * 
 * @features
 * - Automatic caching of GET requests
 * - Configurable TTL (time-to-live)
 * - Automatic cache expiration
 * - Cache size management (max 1000 entries)
 * - X-Cache header (HIT/MISS) for debugging
 * - Manual cache clearing by pattern
 * 
 * @usage
 * ```javascript
 * import { cacheMiddleware, clearCache } from './middleware/cache.js';
 * 
 * // Cache for 5 minutes (default)
 * router.get('/api/metrics', cacheMiddleware(), getMetrics);
 * 
 * // Cache for 1 hour
 * router.get('/api/licenses', cacheMiddleware(3600), getLicenses);
 * 
 * // Clear cache manually
 * clearCache(); // Clear all
 * clearCache('/api/licenses'); // Clear matching pattern
 * ```
 * 
 * @cache-behavior
 * - Only caches GET requests (POST, PUT, DELETE bypass cache)
 * - Cache key is the full request URL (req.originalUrl)
 * - Returns cached response if not expired
 * - Stores new responses automatically
 * - Adds X-Cache: HIT or X-Cache: MISS header
 * 
 * @cache-management
 * - Max cache size: 1000 entries
 * - When limit reached: Cleans all expired entries
 * - Manual clearing: clearCache() or clearCache(pattern)
 * 
 * @production-notes
 * ⚠️ **This is an in-memory cache suitable for development only**
 * 
 * For production, use Redis:
 * ```javascript
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * export function cacheMiddleware(ttl = 300) {
 *   return async (req, res, next) => {
 *     const cached = await redis.get(req.originalUrl);
 *     if (cached) return res.json(JSON.parse(cached));
 *     // ... store in Redis after response
 *   };
 * }
 * ```
 * 
 * @limitations
 * - Not shared across server instances (use Redis for multi-instance)
 * - Lost on server restart
 * - Memory usage grows with cached entries
 * - No cache invalidation on data changes (manual clearing required)
 * 
 * @cache-invalidation
 * Clear cache when data changes:
 * ```javascript
 * router.post('/api/licenses', async (req, res) => {
 *   await createLicense(req.body);
 *   clearCache('/api/licenses'); // Invalidate cache
 *   res.json({ success: true });
 * });
 * ```
 * 
 * @dependencies
 * - None (pure JavaScript Map)
 * 
 * @related-files
 * - backend/src/routes/*.js - Can use cacheMiddleware on GET routes
 * 
 * @module cache.middleware
 * @path /backend/src/middleware/cache.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

const cache = new Map()

export function cacheMiddleware(ttl = 300) { // 5 minutos por defecto
  return (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const key = req.originalUrl || req.url
    const cached = cache.get(key)

    if (cached && Date.now() < cached.expires) {
      res.set('X-Cache', 'HIT')
      return res.json(cached.data)
    }

    // Guardar respuesta original
    const originalJson = res.json.bind(res)
    res.json = function (data) {
      cache.set(key, {
        data,
        expires: Date.now() + (ttl * 1000)
      })

      // Limpiar caché expirado periódicamente
      if (cache.size > 1000) {
        const now = Date.now()
        for (const [k, v] of cache.entries()) {
          if (now >= v.expires) {
            cache.delete(k)
          }
        }
      }

      return originalJson(data)
    }

    res.set('X-Cache', 'MISS')
    next()
  }
}

/**
 * Limpiar caché manualmente
 */
export function clearCache(pattern = null) {
  if (!pattern) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}
