# Mapa del Sistema (Software Architecture Map)

Este documento detalla la estructura de navegación del Frontend y los endpoints disponibles en el Backend.

---

## 🖥️ FRONTEND (Vistas y Páginas)

### 📂 src/pages (Raíz)
Accesibles principalmente desde el Sidebar o Navegación principal.

| Archivo | Ruta (Frontend) | Descripción Funcional |
| :--- | :--- | :--- |
| `Panel.jsx` | `/dashboard` (Master), `/panel` | Dashboard principal. Muestra métricas generales y accesos rápidos. |
| `CRM.jsx` | `/crm` | Punto de entrada al módulo CRM. Redirige al Dashboard de CRM. |
| `Configuracion.jsx` | `/configuracion` | Centro de control del sistema. Tabs: Constantes, Roles, Versiones, Hosting, Email, Integraciones, Auditoría. |
| `Dashboard.jsx` | `/clients/dashboard` | Vista para el usuario final (Cliente) con sus licencias y estado. |
| `Activations.jsx` | `/activations` | Historial de activaciones de licencias. |
| `ActiveSessions.jsx` | `/sessions` | Gestión de sesiones activas de usuarios. |
| `AdminUsers.jsx` | `/admin/users` | Gestión de usuarios del sistema (Activadores, Masters). |
| `AdminClients.jsx` | `/admin/clients` | Gestión de Organizaciones (Clientes) y usuarios externos. |
| `AdminProspects.jsx` | `/admin/prospects` | Pipeline unificado de prospectos (Kanban). |
| `AdminLicenses.jsx` | `/admin/licenses` | Maestro de Licencias. Creación y asignación. |
| `NewClient.jsx` | `/clients/new` | Formulario wizard para registrar un nuevo cliente. |
| `PendingClients.jsx` | `/admin/pending-clients` | Bandeja de entrada de solicitudes de clientes nuevos. |
| `PendingLicensesInbox.jsx` | `/admin/pending-licenses` | Bandeja de licencias pendientes de aprobación/pago. |
| `AdminActivations.jsx` | `/admin/activations` | Vista administrativa de todas las activaciones globales. |
| `AdminAudit.jsx` | `/admin/audit` | Registro de auditoría del sistema. |
| `AdminCRMDashboard.jsx` | `/crm/dashboard` | Métricas de ventas, conversión y rendimiento del CRM. |
| `AdminServersAndDomains.jsx` | `/infrastructure` | Gestión de Nodos (Servers) y Dominios permitidos. |
| `AdminPlans.jsx` | `/config/plans` | Gestión de planes de precios y características. |
| `AdminConstants.jsx` | `/config/constants` | (Componente) Edición de variables globales del sistema. |
| `AdminEmailTemplates.jsx` | `/config/templates` | Editor de plantillas HTML para correos transaccionales. |
| `AdminIntegrations.jsx` | `/config/integrations` | Configuración de APIs externas (PayPal, etc). |
| `AdminMigrationClients.jsx` | `/admin/migrations` | Monitor de estado de migraciones de datos. |
| `GeographicMetrics.jsx` | `/metrics/geo` | Mapas y estadísticas de distribución de clientes. |
| `HostingCosts.jsx` | `/metrics/hosting` | Análisis de costos de infraestructura vs ingresos. |
| `PurchasePage.jsx` | `/purchase/:token` | Landing pública para finalizar compra (Magic Link). |
| `Register.jsx` | `/register` | Registro público de usuarios/clientes. |
| `ForgotPassword.jsx` | `/forgot-password` | Recuperación de acceso. |

### 📂 src/pages/CRM
Sub-módulo específico para ventas.

| Archivo | Descripción |
| :--- | :--- |
| `ClientList.jsx` | (Componente) Vista detallada de lista de clientes para CRM. |

---

## ⚙️ BACKEND (API Routes)

### 📂 src/routes
Prefijo base: `/api`

| Archivo | Endpoint Base | Descripción |
| :--- | :--- | :--- |
| `auth.js` | `/auth` | Login, Registro, Refresh Token, Reset Password. |
| `users.js` | `/users` | CRUD de Usuarios (Activadores/Staff). |
| `clients.js` | `/clients` | Gestión de Organizaciones. |
| `prospects.js` | `/prospects` | Gestión de Prospectos y Pipeline (CRM). |
| `licenses.js` | `/licenses` | Gestión de claves de producto y asignaciones. |
| `activations.js` | `/activations` | Registro y validación de activaciones de software. |
| `audit.js` | `/audit` | Lectura de logs de auditoría. |
| `settings.js` | `/settings` | CRUD de SystemSettings (Constantes). |
| `catalog.js` | `/catalog` | Listas de precios, planes de hosting, versiones de licencia. |
| `roles.js` | `/roles` | Gestión de roles y permisos dinámicos. |
| `servers.js` | `/servers` | Gestión de infraestructura (ServerNodes). |
| `domains.js` | `/domains` | Dominios autorizados para hosting. |
| `templates.js` | `/email-templates` | ABM de plantillas de correo. |
| `notifications.js` | `/notifications` | Sistema de alertas internas. |
| `followups.js` | `/followups` | Registro de seguimientos (llamadas, emails) a prospectos. |
| `migration-clients.js` | `/migration` | Endpoints para herramientas de migración. |
| `me.js` | `/me` | Perfil del usuario autenticado. |
| `paypal.js` | `/paypal` | Webhooks e integración de pagos. |
| `backup.js` | `/backup` | Herramientas de respaldo (Admin only). |

---

## 🗺️ Componentes Clave (Frontend)

| Componente | Ubicación | Función |
| :--- | :--- | :--- |
| `PageLayout.jsx` | `src/layout` | Estructura base de todas las páginas (Sidebar, Header). |
| `app-sidebar.jsx` | `src/layout` | Menú lateral dinámico según rol de usuario. |
| `DataTable.jsx` | `src/components` | Tabla genérica con paginación y filtros usada en todos los ABM. |
| `GlobalSelects.jsx` | `src/components` | Selectores reutilizables (Países, Planes). |
