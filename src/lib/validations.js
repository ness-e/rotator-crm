import { z } from 'zod';

/**
 * @file validations.js
 * @description Frontend Zod validation schemas for forms and user input.
 * All schemas are functions that accept a translation function 't' to support dynamic localization.
 */

// ============ AUTENTICACIÓN ============

export const loginSchema = (t) => z.object({
    email: z.string()
        .email(t('validation.emailInvalid'))
        .toLowerCase(),
    password: z.string()
        .min(6, t('validation.passwordMin', { count: 6 })),
});

export const registerSchema = (t) => z.object({
  correo_cliente: z.string().email(t('validation.emailInvalid')),
  password_cliente: z.string()
    .min(8, t('validation.passwordMin', { count: 8 }))
    .regex(/[A-Z]/, t('validation.passwordUppercase'))
    .regex(/[a-z]/, t('validation.passwordLowercase'))
    .regex(/[0-9]/, t('validation.passwordNumber')),
  confirmPassword: z.string(),
  nombre_cliente: z.string().trim().min(1, t('validation.nameRequired')).max(100, t('validation.nameMax', { count: 100 })),
  apellido_cliente: z.string().trim().min(1, t('validation.lastNameRequired')).max(100, t('validation.nameMax', { count: 100 })),
  organizacion_cliente: z.string().trim().min(1, t('validation.orgRequired')).max(200),
  telefono_cliente: z.string().trim().max(50).optional(),
}).refine((data) => data.password_cliente === data.confirmPassword, {
  message: t('validation.passwordMatch'),
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = (t) => z.object({
    email: z.string().email(t('validation.emailInvalid'))
});

export const resetPasswordSchema = (t) => z.object({
  email: z.string().email(t('validation.emailInvalid')),
  code: z.string().length(6, t('validation.minLength', { count: 6 })),
  newPassword: z.string().min(8, t('validation.passwordMin', { count: 8 })),
  confirmPassword: z.string().min(8, t('validation.passwordMatch'))
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t('validation.passwordMatch'),
  path: ['confirmPassword'],
});

// ============ USUARIOS Y ORGANIZACIONES ============

/**
 * Esquema para usuarios del sistema (MASTER, ANALISTA, etc.)
 * Utilizado en AdminUsers.jsx
 */
export const systemUserSchema = (t) => z.object({
    firstName: z.string().min(1, t('validation.nameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    email: z.string().email(t('validation.emailInvalid')),
    role: z.enum(['MASTER', 'ANALISTA', 'VISUALIZADOR', 'CLIENTE']).default('CLIENTE'),
    organizationId: z.string().min(1, t('validation.orgRequired')),
    phone: z.string().optional(),
    password: z.string().optional()
});

/**
 * Esquema para clientes (usuarios finales)
 * Utilizado en AdminClients.jsx y formularios de registro manual
 */
export const clientUserSchema = (t) => z.object({
    nombre_cliente: z.string()
        .min(2, t('validation.minLength', { count: 2 }))
        .max(100, t('validation.maxLength', { count: 100 })),
    apellido_cliente: z.string()
        .min(2, t('validation.minLength', { count: 2 }))
        .max(100, t('validation.maxLength', { count: 100 })),
    correo_cliente: z.string()
        .email(t('validation.emailInvalid'))
        .toLowerCase(),
    telefono_cliente: z.string()
        .optional()
        .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
            message: t('validation.phoneInvalid')
        }),
    pais_cliente: z.string()
        .min(2, t('validation.countrySelect'))
        .max(2, t('validation.countryInvalid')),
    ciudad_cliente: z.string().optional(),
    direccion_cliente: z.string().optional(),
    organizacion_cliente: z.string().optional(),
    empresa_cliente: z.string().optional(),
    notas: z.string().optional(),
});

export const organizationSchema = (t) => z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.emailInvalid')).optional().or(z.literal('')),
    password: z.string().min(6, t('validation.passwordMin', { count: 6 })).optional().or(z.literal('')),
    taxId: z.string().optional(),
    countryCode: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    clientType: z.string().default('C'),
    notes: z.string().optional().nullable(),
    isMaster: z.boolean().optional(),
    isActive: z.boolean().optional(),
    phone: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    marketTargetId: z.number().optional().nullable(),
    ejecutivoId: z.number().optional().nullable(),
    language: z.string().optional().nullable(),
    adminContactName: z.string().optional().nullable(),
    adminContactLastName: z.string().optional().nullable(),
    adminContactEmail: z.string().email(t('validation.emailInvalid')).optional().nullable().or(z.literal('')),
    useContactName: z.string().optional().nullable(),
    useContactLastName: z.string().optional().nullable(),
    useContactEmail: z.string().email(t('validation.emailInvalid')).optional().nullable().or(z.literal('')),
    businessType: z.string().optional().nullable(),
    status: z.string().optional(),
    primerContactoId: z.number().optional().nullable()
});

// ============ LICENCIAS ============

export const licenseSchema = (t) => z.object({
    id: z.number().optional(),
    organizationId: z.string().min(1, t('validation.required')),
    serialKey: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
    expirationDate: z.string().optional(),
    hostingPlanId: z.coerce.number().optional(),
    licenseServers: z.array(z.object({
        serverId: z.coerce.number(),
        domainId: z.preprocess((val) => val === '' ? null : val, z.coerce.number().nullable())
    })).default([]),
    ownedByUserId: z.coerce.number().optional(),
    notes: z.string().optional(),
    limitQuestions: z.coerce.number().min(0),
    limitCases: z.coerce.number().min(0),
    limitAdmins: z.coerce.number().min(1),
    limitMobileUsers: z.coerce.number().min(0),
    limitPhoneUsers: z.coerce.number().min(0),
    limitDataEntry: z.coerce.number().min(0),
    limitAnalysts: z.coerce.number().min(0),
    limitClients: z.coerce.number().min(0),
    limitClassifiers: z.coerce.number().min(0),
    limitCaptureSupervisors: z.coerce.number().min(0),
    limitKioskSupervisors: z.coerce.number().min(0),
    limitParticipants: z.coerce.number().min(0),
    concurrentQuestionnaires: z.coerce.number().min(0),
    versionId: z.coerce.number().optional()
});

export const licenseLegacySchema = (t) => z.object({
    licencia_serial: z.string()
        .min(10, t('validation.minLength', { count: 10 }))
        .max(100, t('validation.maxLength', { count: 100 })),
    licencia_tipo: z.enum(['TRIAL', 'STANDARD', 'PREMIUM', 'ENTERPRISE'], {
        errorMap: () => ({ message: t('validation.licenseTypeInvalid') })
    }),
    licencia_expira: z.coerce.date({
        errorMap: () => ({ message: t('validation.expirationDateInvalid') })
    }),
    licencia_activa: z.boolean().default(true),
    max_usuarios: z.coerce.number()
        .int(t('validation.intRequired'))
        .min(1, t('validation.valueMin', { count: 1 }))
        .max(10000, t('validation.valueMax', { count: 10000 }))
        .optional(),
    max_dispositivos: z.coerce.number()
        .int(t('validation.intRequired'))
        .min(1, t('validation.valueMin', { count: 1 }))
        .optional(),
    notas: z.string().optional(),
});

// ============ CRM - CLIENTES ============

export const crmClientSchema = (t) => z.object({
    nombre: z.string()
        .min(2, t('validation.minLength', { count: 2 }))
        .max(200, t('validation.maxLength', { count: 200 })),
    email: z.string()
        .email(t('validation.emailInvalid'))
        .toLowerCase(),
    telefono: z.string()
        .optional()
        .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
            message: t('validation.phoneInvalid')
        }),
    empresa: z.string().optional(),
    pais: z.string().min(2, t('validation.countrySelect')).optional(),
    ciudad: z.string().optional(),
    direccion: z.string().optional(),
    sitio_web: z.string()
        .url(t('validation.domainFormatInvalid'))
        .optional()
        .or(z.literal('')),
    notas: z.string().optional(),
    fecha_registro: z.coerce.date().optional(),
});

// ============ CRM - PROSPECTOS ============

export const prospectSchema = (t) => z.object({
    nombre: z.string()
        .min(2, t('validation.minLength', { count: 2 }))
        .max(200, t('validation.maxLength', { count: 200 })),
    email: z.string()
        .email(t('validation.emailInvalid'))
        .toLowerCase(),
    telefono: z.string().optional(),
    empresa: z.string().optional(),
    estado: z.enum(['NUEVO', 'CONTACTADO', 'CALIFICADO', 'NEGOCIACION', 'GANADO', 'PERDIDO'], {
        errorMap: () => ({ message: t('validation.statusInvalid') })
    }),
    origen: z.enum(['WEB', 'REFERIDO', 'EVENTO', 'LLAMADA', 'EMAIL', 'OTRO'], {
        errorMap: () => ({ message: t('validation.originInvalid') })
    }).optional(),
    valor_estimado: z.coerce.number()
        .min(0, t('validation.valueNegative'))
        .optional(),
    probabilidad: z.coerce.number()
        .min(0, t('validation.valueMin', { count: 0 }))
        .max(100, t('validation.valueMax', { count: 100 }))
        .optional(),
    fecha_contacto: z.coerce.date().optional(),
    fecha_cierre_estimada: z.coerce.date().optional(),
    notas: z.string().optional(),
});

// ============ CRM - COSTOS DE HOSTING ============

export const hostingCostSchema = (t) => z.object({
    cliente_nombre: z.string()
        .min(2, t('validation.required')),
    servidor: z.string()
        .min(2, t('validation.required')),
    dominio: z.string()
        .min(2, t('validation.required')),
    costo_mensual: z.coerce.number()
        .min(0, t('validation.valueNegative')),
    moneda: z.enum(['USD', 'EUR', 'MXN', 'COP', 'ARS'], {
        errorMap: () => ({ message: t('validation.currencyInvalid') })
    }).default('USD'),
    fecha_inicio: z.coerce.date(),
    fecha_renovacion: z.coerce.date().optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

// ============ CRM - SEGUIMIENTOS ============

export const followUpSchema = (t) => z.object({
    cliente_id: z.coerce.number().int().positive(),
    tipo: z.enum(['LLAMADA', 'EMAIL', 'REUNION', 'DEMO', 'OTRO'], {
        errorMap: () => ({ message: t('validation.typeInvalid') })
    }),
    fecha: z.coerce.date(),
    hora: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, t('validation.timeInvalid')),
    descripcion: z.string()
        .min(5, t('validation.minLength', { count: 5 }))
        .max(500, t('validation.maxLength', { count: 500 })),
    completado: z.boolean().default(false),
    resultado: z.string().optional(),
});

// ============ PLANES Y VERSIONES ============

export const planVersionSchema = (t) => z.object({
    id_version: z.coerce.number().int().positive().optional(),
    version_nombre: z.string().min(1, t('validation.required')).refine(val => val.trim().split(/\s+/).length === 2, t('validation.twoWords')),
    version_letra: z.string().min(1, t('validation.required')),
    n_preguntas: z.coerce.number().int().min(0).default(0),
    n_casos: z.coerce.number().int().min(0).default(0),
    n_admins: z.coerce.number().int().min(0).default(0),
    n_moviles: z.coerce.number().int().min(0).default(0),
    n_telefonicos: z.coerce.number().int().min(0).default(0),
    n_digitadores: z.coerce.number().int().min(0).default(0),
    n_analistas: z.coerce.number().int().min(0).default(0),
    n_clientes: z.coerce.number().int().min(0).default(1),
    n_clasificadores: z.coerce.number().int().min(0).default(0),
    n_supervisores_captura: z.coerce.number().int().min(0).default(0),
    n_supervisores_kiosco: z.coerce.number().int().min(0).default(0),
    n_participantes: z.coerce.number().int().min(0).default(0),
    hosting: z.coerce.number().int().nullable().optional(),
    cuestionarios_concurrentes: z.coerce.number().int().min(0).default(0),
    servidor: z.coerce.number().int().nullable().optional(),
    price_monthly: z.coerce.number().min(0).optional(),
    price_annual: z.coerce.number().min(0).optional(),
    price_currency: z.string().default('USD'),
});

export const hostingPlanSchema = (t) => z.object({
    id: z.coerce.number().int().positive().optional(),
    name: z.string().min(1, t('validation.required')),
    abbreviation: z.string().min(1, t('validation.required')),
    concurrentQuestionnaires: z.coerce.number().int().min(0).default(0),
});

// ============ SERVIDORES Y DOMINIOS ============

export const serverSchema = (t) => z.object({
    nombre: z.string()
        .min(2, t('validation.minLength', { count: 2 })),
    ip: z.string()
        .regex(/^(\d{1,3}\.){3}\d{1,3}$/, t('validation.ipInvalid')),
    proveedor: z.string().optional(),
    ubicacion: z.string().optional(),
    costo_mensual: z.coerce.number().min(0, t('validation.valueNegative')).optional(),
    fecha_expiracion: z.coerce.date().optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

export const domainSchema = (t) => z.object({
    nombre: z.string()
        .min(3, t('validation.minLength', { count: 3 }))
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, t('validation.domainFormatInvalid')),
    registrador: z.string().optional(),
    fecha_registro: z.coerce.date().optional(),
    fecha_expiracion: z.coerce.date(),
    auto_renovacion: z.boolean().default(false),
    costo_anual: z.coerce.number().min(0, t('validation.valueNegative')).optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

// ============ PERFIL DE USUARIO ============

export const profileUpdateSchema = (t) => z.object({
    nombre_cliente: z.string().trim().min(1, t('validation.nameRequired')),
    apellido_cliente: z.string().trim().min(1, t('validation.lastNameRequired')),
    pais_cliente: z.string().trim().min(1, t('validation.countrySelect')),
    ciudad_cliente: z.string().trim().optional(),
    organizacion_cliente: z.string().trim().min(1, t('validation.orgRequired')),
    direccion_cliente: z.string().trim().optional(),
    telefono_cliente: z.string().trim().optional(),
});

export const profileSchema = (t) => z.object({
    nombre: z.string().min(2, t('validation.nameRequired')),
    apellido: z.string().min(2, t('validation.lastNameRequired')),
    email: z.string().email(t('validation.emailInvalid')),
    telefono: z.string().optional(),
    empresa: z.string().optional(),
});

export const changePasswordSchema = (t) => z.object({
    currentPassword: z.string().min(1, t('validation.required')),
    newPassword: z.string()
        .min(8, t('validation.passwordMin', { count: 8 }))
        .regex(/[A-Z]/, t('validation.passwordUppercase'))
        .regex(/[a-z]/, t('validation.passwordLowercase'))
        .regex(/[0-9]/, t('validation.passwordNumber')),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordMatch'),
    path: ['confirmPassword'],
});

// Export default para compatibilidad con importaciones dinámicas si fuera necesario
export default {
    loginSchema,
    registerSchema,
    systemUserSchema,
    clientUserSchema,
    organizationSchema,
    planVersionSchema,
    hostingPlanSchema,
    licenseSchema,
    crmClientSchema,
    prospectSchema,
    hostingCostSchema,
    followUpSchema,
    serverSchema,
    domainSchema,
    profileSchema,
    profileUpdateSchema,
    changePasswordSchema,
};
