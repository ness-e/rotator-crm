import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import { Toaster } from '@/components/ui/toaster';
import NavigationProgress from '@/components/navigation-progress';
import AdminLayout from '@/layouts/AdminLayout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations.jsx'));
const GestionPage = lazy(() => import('./pages/GestionPage.jsx'));
const ClientesPage = lazy(() => import('./pages/ClientesPage.jsx'));
const CRM = lazy(() => import('./pages/CRM.jsx'));
const Configuracion = lazy(() => import('./pages/Configuracion.jsx'));
const Panel = lazy(() => import('./pages/Panel.jsx'));
const NewClient = lazy(() => import('./pages/NewClient.jsx'));
const ClientDetail = lazy(() => import('./pages/CRM/ClientDetail.jsx'));
const HostingCosts = lazy(() => import('./pages/HostingCosts.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const PurchasePage = lazy(() => import('./pages/PurchasePage.jsx'));

// Helper to check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    // Check if token is expired (optional but recommended)
    const exp = decoded.exp * 1000;
    if (Date.now() > exp) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

// Helper to get user role redirect path
const getRedirectPath = () => {
  const token = localStorage.getItem('token');
  if (!token) return '/';
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const isMaster = decoded.isMaster === true || 
                    decoded.tipo === 'MASTER' || 
                    decoded.role === 'SUPER_ADMIN' || 
                    decoded.role === 'MASTER';
    return isMaster ? '/admin/dashboard' : '/panel';
  } catch (e) {
    return '/';
  }
};

// Route wrapper for protected pages
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Route wrapper for public pages (prevents logged in users from seeing login)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to={getRedirectPath()} replace />;
  }
  return children;
};

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Client Routes */}
          <Route path="/panel" element={
            <ProtectedRoute>
              <Panel />
            </ProtectedRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gestion" element={<GestionPage />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="configuracion" element={<Configuracion />} />
            
            {/* Legacy redirects */}
            <Route path="overview" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="stats" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="settings" element={<Navigate to="/admin/configuracion" replace />} />
            <Route path="roles" element={<Navigate to="/admin/configuracion" replace />} />
            <Route path="backup" element={<Navigate to="/admin/configuracion" replace />} />
            <Route path="new-client-manual" element={<Navigate to="/admin/new-client" replace />} />
            <Route path="new-client-email" element={<Navigate to="/admin/new-client" replace />} />
            <Route path="users" element={<Navigate to="/admin/gestion?tab=users" replace />} />
            <Route path="licenses" element={<Navigate to="/admin/gestion?tab=licenses" replace />} />
            <Route path="management" element={<Navigate to="/admin/gestion" replace />} />
            <Route path="default-plans" element={<Navigate to="/admin/configuracion?tab=versiones" replace />} />
            <Route path="audit" element={<Navigate to="/admin/gestion?tab=audit" replace />} />
            <Route path="activations" element={<Navigate to="/admin/gestion?tab=activations" replace />} />
            <Route path="pending-licenses-inbox" element={<Navigate to="/admin/configuracion?tab=licencias" replace />} />
            <Route path="prospects" element={<Navigate to="/admin/crm?tab=pipeline" replace />} />
            <Route path="pending-clients" element={<Navigate to="/admin/clientes?tab=pending" replace />} />
            <Route path="clients" element={<Navigate to="/admin/clientes?tab=active" replace />} />

            <Route path="crm" element={<CRM />} />
            <Route path="crm/clients/:id" element={<ClientDetail />} />
            <Route path="hosting-costs" element={<HostingCosts />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

