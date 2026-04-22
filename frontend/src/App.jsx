import React, { lazy, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip'
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import { Toaster } from '@/components/ui/toaster';
import NavigationProgress from '@/components/navigation-progress';
import AdminLayout from '@/layouts/AdminLayout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations.jsx'));
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'));
const AdminLicenses = lazy(() => import('./pages/AdminLicenses.jsx'));
const PendingLicensesInbox = lazy(() => import('./pages/PendingLicensesInbox.jsx'));
const AdminActivations = lazy(() => import('./pages/AdminActivations.jsx'));
const AdminAudit = lazy(() => import('./pages/AdminAudit.jsx'));
const CRM = lazy(() => import('./pages/CRM.jsx'));
const AdminClients = lazy(() => import('./pages/AdminClients.jsx'));
const AdminProspects = lazy(() => import('./pages/AdminProspects.jsx'));
const AdminServersAndDomains = lazy(() => import('./pages/AdminServersAndDomains.jsx'));
const Configuracion = lazy(() => import('./pages/Configuracion.jsx'));
const Estadisticas = lazy(() => import('./pages/Estadisticas.jsx'));
const Panel = lazy(() => import('./pages/Panel.jsx'));
const ClientDetail = lazy(() => import('./pages/CRM/ClientDetail.jsx'));

const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const PurchasePage = lazy(() => import('./pages/PurchasePage.jsx'));

// Helper to check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
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
                    decoded.role === 'MASTER' ||
                    decoded.role === 'ANALISTA' ||
                    decoded.role === 'VISUALIZADOR';
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
    <TooltipProvider>
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
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="gestion/users" element={<AdminUsers />} />
            <Route path="gestion/licenses" element={<AdminLicenses />} />
            <Route path="gestion/pending-licenses" element={<PendingLicensesInbox />} />
            <Route path="gestion/activations" element={<AdminActivations />} />
            <Route path="gestion/audit" element={<AdminAudit />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="crm" element={<CRM />} />
            <Route path="crm/clients" element={<AdminClients />} />
            <Route path="crm/prospects" element={<AdminProspects />} />
            <Route path="crm/clients/:id" element={<ClientDetail />} />
            <Route path="infraestructura" element={<AdminServersAndDomains />} />
            <Route path="configuracion" element={<Configuracion />} />
            
            {/* Legacy redirects — map old routes to new structure */}
            <Route path="overview" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="stats" element={<Navigate to="/admin/estadisticas" replace />} />
            <Route path="settings" element={<Navigate to="/admin/configuracion" replace />} />
            <Route path="roles" element={<Navigate to="/admin/configuracion?tab=roles" replace />} />
            <Route path="backup" element={<Navigate to="/admin/configuracion?tab=avanzado" replace />} />
            <Route path="new-client" element={<Navigate to="/admin/organizations" replace />} />
            <Route path="new-client-manual" element={<Navigate to="/admin/organizations" replace />} />
            <Route path="new-client-email" element={<Navigate to="/admin/organizations" replace />} />
            <Route path="users" element={<Navigate to="/admin/gestion/users" replace />} />
            <Route path="licenses" element={<Navigate to="/admin/gestion/licenses" replace />} />
            <Route path="management" element={<Navigate to="/admin/gestion/users" replace />} />
            <Route path="default-plans" element={<Navigate to="/admin/configuracion?tab=planes" replace />} />
            <Route path="audit" element={<Navigate to="/admin/gestion/audit" replace />} />
            <Route path="activations" element={<Navigate to="/admin/gestion/activations" replace />} />
            <Route path="pending-licenses-inbox" element={<Navigate to="/admin/gestion/pending-licenses" replace />} />
            <Route path="prospects" element={<Navigate to="/admin/crm?tab=pipeline" replace />} />
            <Route path="pending-clients" element={<Navigate to="/admin/crm?tab=pending" replace />} />
            <Route path="clients" element={<Navigate to="/admin/crm?tab=active" replace />} />
            
            {/* Old Clientes routes redirect to CRM */}
            <Route path="clientes" element={<Navigate to="/admin/crm" replace />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </TooltipProvider>
    </>
  );
}
