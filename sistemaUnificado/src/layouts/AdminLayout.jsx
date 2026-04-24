/**
 * @file AdminLayout.jsx
 * @description Main admin layout with sidebar, breadcrumbs, and notifications.
 *   Uses Zustand auth store for user state (no duplicate fetchMe calls).
 * @module Layout
 * @path /frontend/src/layouts/AdminLayout.jsx
 * @lastUpdated 2026-03-20
 */

import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import NotificationsMenu from '@/components/NotificationsMenu';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout() {
  const { user: me, setUser: setMe } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!me); // Skip loading if already cached
  const [showNotifications, setShowNotifications] = useState(false);
  const fetchedRef = useRef(false); // Prevent duplicate fetches

  const nav = useNavigate();
  const location = useLocation();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { }
    useAuthStore.getState().logout();
    nav('/');
  };

  useEffect(() => {
    // Skip if already fetched in this session or if user data exists
    if (fetchedRef.current || me) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;

    const fetchMe = async (retries = 2) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          nav('/');
          return;
        }

        const res = await api.get('/me');

        if (!res.ok) {
          if (res.status === 429) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
            if (retryAfter > 5) {
               throw new Error(`Límite de peticiones alcanzado. Por favor, intenta de nuevo en ${Math.ceil(retryAfter / 60)} minutos.`);
            }
            if (retries > 0) {
              await new Promise(r => setTimeout(r, retryAfter * 1000));
              return fetchMe(retries - 1);
            }
            throw new Error('Límite de peticiones alcanzado. Por favor, intenta más tarde.');
          }

          if (res.status === 401) {
            useAuthStore.getState().logout();
            nav('/');
            return;
          }
          throw new Error('Error al obtener datos del usuario');
        }

        const data = await res.json();
        setMe(data); // Store in Zustand — persists across re-renders
      } catch (err) {
        setError(err.message);
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []); // Empty deps — only run once on mount


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => { setError(''); fetchedRef.current = false; setLoading(true); window.location.reload(); }}
            className="text-sm text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={me}
      />
      <SidebarInset>
        <AdminHeader 
          user={me} 
          unreadCount={me?.unreadNotifications || 0}
          onNotificationsClick={() => setShowNotifications(true)}
          onLogout={logout}
        />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <NotificationsMenu
            mode="list"
            onRead={(count) =>
              setMe({ ...me, unreadNotifications: count })
            }
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
