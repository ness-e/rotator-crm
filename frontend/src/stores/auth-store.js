/**
 * @file auth-store.js
 * @description Zustand authentication state management store
 * 
 * @overview
 * Global authentication state store using Zustand. Manages user data, tokens,
 * login/logout actions, and user profile updates across the application.
 * 
 * @features
 * - Global auth state management
 * - User data storage
 * - Token management
 * - Login/logout actions
 * - User profile updates
 * - LocalStorage synchronization
 * 
 * @usage
 * ```javascript
 * import { useAuthStore } from './stores/auth-store';
 * 
 * function Component() {
 *   const { user, token, login, logout, updateUser } = useAuthStore();
 *   
 *   // Login
 *   const handleLogin = async () => {
 *     const response = await fetch('/api/auth/login', {...});
 *     const { user, token } = await response.json();
 *     login(user, token);
 *   };
 *   
 *   // Logout
 *   const handleLogout = () => {
 *     logout(); // Clears localStorage and state
 *   };
 *   
 *   // Update user profile
 *   updateUser({ name: 'New Name' });
 * }
 * ```
 * 
 * @state-structure
 * - user: User object or null
 * - token: JWT access token or null
 * 
 * @actions
 * - setUser(user) - Set user data
 * - setToken(token) - Set access token
 * - login(user, token) - Set both user and token
 * - logout() - Clear all auth data and localStorage
 * - updateUser(userData) - Merge updates into existing user
 * 
 * @module auth-store
 * @path /frontend/src/stores/auth-store.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
    user: null,
    token: null,

    setUser: (user) => set({ user }),

    setToken: (token) => set({ token }),

    login: (user, token) => set({ user, token }),

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({ user: null, token: null })
    },

    updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
    })),
}))
