/**
 * @file api.js
 * @description API client utility with automatic authentication and token refresh
 * 
 * @overview
 * Provides a simple fetch wrapper that automatically adds authentication headers,
 * handles token refresh on 401 responses, and ensures all API calls use the /api prefix.
 * 
 * @features
 * - Automatic Bearer token injection
 * - Automatic /api prefix for all requests
 * - Token refresh on 401 Unauthorized
 * - Convenience methods (get, post, put, delete)
 * - JSON body serialization
 * 
 * @usage
 * ```javascript
 * import { api, apiFetch } from './utils/api.js';
 * 
 * // Using convenience methods
 * const users = await api.get('/users');
 * const newUser = await api.post('/users', { email: 'user@example.com' });
 * await api.put('/users/123', { name: 'Updated Name' });
 * await api.delete('/users/123');
 * 
 * // Using apiFetch directly
 * const res = await apiFetch('/licenses', {
 *   method: 'GET',
 *   cache: 'no-store'
 * });
 * const data = await res.json();
 * ```
 * 
 * @auto-features
 * - Adds /api prefix if not present
 * - Adds Authorization: Bearer header if token exists
 * - Adds Content-Type: application/json for requests with body
 * - Retries request after successful token refresh
 * 
 * @token-refresh-flow
 * 1. Request returns 401 Unauthorized
 * 2. Check for refreshToken in localStorage
 * 3. Call /auth/refresh with refreshToken
 * 4. If successful, save new token
 * 5. Retry original request with new token
 * 6. If refresh fails, return 401 (user should logout)
 * 
 * @module api.utils
 * @path /frontend/src/utils/api.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export async function apiFetch(path, { method = 'GET', headers = {}, body, cache = 'no-store' } = {}) {
  const token = localStorage.getItem('token')
  const fullPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`
  
  const isFormData = body instanceof FormData;
  
  const res = await fetch(fullPath, {
    method,
    headers: {
      ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    cache,
  })
  if (res.status === 401) {
    const rt = localStorage.getItem('refreshToken')
    if (rt) {
      const rr = await fetch('/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
      if (rr.ok) {
        const { token: newToken } = await rr.json()
        if (newToken) {
          localStorage.setItem('token', newToken)
          return apiFetch(path, { method, headers, body, cache })
        }
      }
    }
  }
  return res
}

export const api = {
  get: (path, opts = {}) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts = {}) => apiFetch(path, { ...opts, method: 'DELETE' }),
}
