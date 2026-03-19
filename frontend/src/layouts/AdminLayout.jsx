/**
 * @file AdminLayout.jsx
 * @description Archivo del sistema AdminLayout.jsx.
 * @module Module
 * @path /frontend/src/layouts/AdminLayout.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import NotificationsMenu from '@/components/NotificationsMenu';
import { api } from '@/utils/api';

export default function AdminLayout() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const nav = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    nav('/');
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          nav('/');
          return;
        }

        const res = await api.get('/me');

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            nav('/');
            return;
          }
          throw new Error('Error al obtener datos del usuario');
        }

        const data = await res.json();
        setMe(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [nav]);

  // Función para obtener breadcrumbs dinámicos basados en la ruta
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const routes = {
      '/admin/dashboard': { title: 'Dashboard', parent: null },
      '/admin/gestion': { title: 'Gestión', parent: null },
      '/admin/clientes': { title: 'Clientes', parent: null },
      '/admin/crm': { title: 'CRM', parent: null },
      '/admin/configuracion': { title: 'Configuración', parent: null },
      '/admin/users': { title: 'Usuarios', parent: 'Gestión' },
      '/admin/licenses': { title: 'Licencias', parent: 'Gestión' },
      '/admin/management': { title: 'Administración', parent: 'Gestión' },
      '/admin/default-plans': { title: 'Planes', parent: 'Configuración' },
      '/admin/audit': { title: 'Auditoría', parent: 'Configuración' },
      '/admin/activations': { title: 'Activaciones', parent: 'Gestión' },
      '/admin/prospects': { title: 'Prospectos', parent: 'CRM' },
      '/admin/clients': { title: 'Clientes', parent: 'CRM' },
      '/admin/prospects-pipeline': { title: 'Pipeline', parent: 'CRM' },
      '/admin/hosting-costs': { title: 'Costos de Hosting', parent: 'CRM' },
      '/admin/calendar': { title: 'Calendario', parent: 'CRM' },
      '/admin/new-client': { title: 'Nuevo Cliente', parent: 'Clientes' },
      '/admin/pending-clients': { title: 'Clientes Pendientes', parent: 'Clientes' },
      '/admin/pending-licenses-inbox': { title: 'Licencias Pendientes', parent: 'Gestión' },
    };

    const current = routes[path] || { title: 'Dashboard', parent: null };

    return {
      parent: current.parent,
      current: current.title,
    };
  };

  const breadcrumbs = getBreadcrumbs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={me}
        unreadCount={me?.unreadNotifications || 0}
        onNotificationsClick={() => setShowNotifications(true)}
        onLogout={logout}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.parent && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbPage className="text-muted-foreground">
                      {breadcrumbs.parent}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {breadcrumbs.current !== 'Dashboard' && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">
                      {breadcrumbs.current}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/* REDUCED PADDING - Removed pt-10, now just p-4 md:p-6 */}
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
              setMe((prev) => ({ ...prev, unreadNotifications: count }))
            }
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
