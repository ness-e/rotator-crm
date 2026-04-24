/**
 * @file permissions.js
 * @description Archivo del sistema permissions.js.
 * @module Module
 * @path /frontend/src/constants/permissions.js
 * @lastUpdated 2026-04-21
 * @author Sistema
 */

export const PERMISSIONS = {
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',

    LICENSES_VIEW: 'licenses.view',
    LICENSES_CREATE: 'licenses.create',
    LICENSES_EDIT: 'licenses.edit',
    LICENSES_DELETE: 'licenses.delete',

    AUDIT_VIEW: 'audit.view',
    ROLES_MANAGE: 'roles.manage',
    SETTINGS_MANAGE: 'settings.manage',

    STATS_VIEW: 'stats.view',

    // CRM Permissions
    CRM_VIEW: 'crm.view',
    CRM_MANAGE: 'crm.manage',
    PROSPECTS_VIEW: 'prospects.view',
    PROSPECTS_MANAGE: 'prospects.manage',
    SERVERS_VIEW: 'servers.view',
    SERVERS_MANAGE: 'servers.manage',
    DOMAINS_VIEW: 'domains.view',
    DOMAINS_MANAGE: 'domains.manage',
}

export const PERMISSION_LABELS = {
    [PERMISSIONS.USERS_VIEW]: 'Ver Usuarios',
    [PERMISSIONS.USERS_CREATE]: 'Crear Usuarios',
    [PERMISSIONS.USERS_EDIT]: 'Editar Usuarios',
    [PERMISSIONS.USERS_DELETE]: 'Eliminar Usuarios',
    [PERMISSIONS.LICENSES_VIEW]: 'Ver Licencias',
    [PERMISSIONS.LICENSES_CREATE]: 'Crear Licencias',
    [PERMISSIONS.LICENSES_EDIT]: 'Editar Licencias',
    [PERMISSIONS.LICENSES_DELETE]: 'Eliminar Licencias',
    [PERMISSIONS.AUDIT_VIEW]: 'Ver Auditoría',
    [PERMISSIONS.ROLES_MANAGE]: 'Gestionar Roles',
    [PERMISSIONS.SETTINGS_MANAGE]: 'Gestionar Configuración',
    [PERMISSIONS.STATS_VIEW]: 'Ver Estadísticas',
    // CRM Labels
    [PERMISSIONS.CRM_VIEW]: 'Ver CRM',
    [PERMISSIONS.CRM_MANAGE]: 'Gestionar CRM',
    [PERMISSIONS.PROSPECTS_VIEW]: 'Ver Prospectos',
    [PERMISSIONS.PROSPECTS_MANAGE]: 'Gestionar Prospectos',
    [PERMISSIONS.SERVERS_VIEW]: 'Ver Servidores',
    [PERMISSIONS.SERVERS_MANAGE]: 'Gestionar Servidores',
    [PERMISSIONS.DOMAINS_VIEW]: 'Ver Dominios',
    [PERMISSIONS.DOMAINS_MANAGE]: 'Gestionar Dominios',
}

export const PERMISSION_DESCRIPTIONS = {
    [PERMISSIONS.USERS_VIEW]: 'Permite listar y ver el perfil de los usuarios del sistema.',
    [PERMISSIONS.USERS_CREATE]: 'Permite registrar nuevos usuarios dentro de la organización.',
    [PERMISSIONS.USERS_EDIT]: 'Permite modificar datos de usuarios existentes.',
    [PERMISSIONS.USERS_DELETE]: 'Permite eliminar permanentemente usuarios del sistema.',
    [PERMISSIONS.LICENSES_VIEW]: 'Permite ver el listado de licencias y sus detalles técnicos.',
    [PERMISSIONS.LICENSES_CREATE]: 'Permite generar nuevas licencias para clientes.',
    [PERMISSIONS.LICENSES_EDIT]: 'Permite extender o modificar parámetros de licencias.',
    [PERMISSIONS.LICENSES_DELETE]: 'Permite revocar o eliminar licencias del sistema.',
    [PERMISSIONS.AUDIT_VIEW]: 'Permite consultar el registro de acciones y auditoría del sistema.',
    [PERMISSIONS.ROLES_MANAGE]: 'Permite crear, editar y eliminar roles y sus permisos.',
    [PERMISSIONS.SETTINGS_MANAGE]: 'Permite modificar los ajustes globales y técnicos del sistema.',
    [PERMISSIONS.STATS_VIEW]: 'Permite ver dashboards de métricas y estadísticas de uso.',
    [PERMISSIONS.CRM_VIEW]: 'Acceso básico a la sección de CRM y embudo de ventas.',
    [PERMISSIONS.CRM_MANAGE]: 'Control total sobre configuraciones de CRM y pipelines.',
    [PERMISSIONS.PROSPECTS_VIEW]: 'Permite ver el listado de prospectos y leads.',
    [PERMISSIONS.PROSPECTS_MANAGE]: 'Permite gestionar el ciclo de vida de los prospectos.',
    [PERMISSIONS.SERVERS_VIEW]: 'Permite ver el estado de los nodos de servidores.',
    [PERMISSIONS.SERVERS_MANAGE]: 'Permite dar de alta o baja servidores en el sistema.',
    [PERMISSIONS.DOMAINS_VIEW]: 'Permite ver el listado de dominios gestionados.',
    [PERMISSIONS.DOMAINS_MANAGE]: 'Permite configurar y asignar dominios.',
}

export const PERMISSION_GROUPS = {
    'Usuarios': [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.USERS_DELETE
    ],
    'Licencias': [
        PERMISSIONS.LICENSES_VIEW,
        PERMISSIONS.LICENSES_CREATE,
        PERMISSIONS.LICENSES_EDIT,
        PERMISSIONS.LICENSES_DELETE
    ],
    'CRM': [
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_MANAGE,
        PERMISSIONS.PROSPECTS_VIEW,
        PERMISSIONS.PROSPECTS_MANAGE,
        PERMISSIONS.SERVERS_VIEW,
        PERMISSIONS.SERVERS_MANAGE,
        PERMISSIONS.DOMAINS_VIEW,
        PERMISSIONS.DOMAINS_MANAGE
    ],
    'Sistema': [
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.ROLES_MANAGE,
        PERMISSIONS.SETTINGS_MANAGE,
        PERMISSIONS.STATS_VIEW
    ]
}

export const ALL_PERMISSIONS = Object.values(PERMISSIONS)
