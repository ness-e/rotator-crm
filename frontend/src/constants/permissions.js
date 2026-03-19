/**
 * @file permissions.js
 * @description Archivo del sistema permissions.js.
 * @module Module
 * @path /frontend/src/constants/permissions.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
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

export const ALL_PERMISSIONS = Object.values(PERMISSIONS)

