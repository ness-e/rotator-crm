/**
 * @file validations.js
 * @description Frontend Zod validation schemas for forms and user input
 * 
 * @overview
 * Comprehensive collection of Zod validation schemas for all frontend forms.
 * Provides client-side validation with Spanish error messages for authentication,
 * users, licenses, CRM, servers, domains, and profile management.
 * 
 * @features
 * - 12+ validation schemas
 * - Spanish error messages
 * - Email validation
 * - Password strength requirements
 * - Phone number format validation
 * - URL validation
 * - Date validation
 * - Custom regex patterns
 * 
 * @schema-categories
 * **Authentication:**
 * - loginSchema - Email + password
 * - registerSchema - Full registration with password confirmation
 * 
 * **Users:**
 * - userSchema - User profile data
 * - profileSchema - User profile updates
 * - changePasswordSchema - Password change with confirmation
 * 
 * **Licenses:**
 * - licenseSchema - License creation/editing
 * 
 * **CRM:**
 * - crmClientSchema - CRM client data
 * - prospectSchema - Sales prospects
 * - hostingCostSchema - Hosting costs tracking
 * - followUpSchema - Follow-up activities
 * 
 * **Infrastructure:**
 * - serverSchema - Server information
 * - domainSchema - Domain registration data
 * 
 * @usage
 * ```javascript
 * import { loginSchema, userSchema } from './lib/validations.js';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * 
 * function LoginForm() {
 *   const form = useForm({
 *     resolver: zodResolver(loginSchema),
 *     defaultValues: { email: '', password: '' }
 *   });
 *   
 *   const onSubmit = (data) => {
 *     // data is validated and type-safe
 *     console.log(data);
 *   };
 *   
 *   return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
 * }
 * ```
 * 
 * @password-requirements
 * **Login:** Minimum 6 characters
 * **Registration/Change:** 
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * 
 * @validation-patterns
 * - Email: Standard email format, lowercase
 * - Phone: +?[digits spaces - ()]
 * - IP: xxx.xxx.xxx.xxx
 * - Domain: standard domain format
 * - Time: HH:MM (24-hour format)
 * 
 * @module validations.lib
 * @path /frontend/src/lib/validations.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { z } from 'zod';

// ============ AUTENTICACIÓN ============
export const loginSchema = z.object({
    email: z.string()
        .email('Email inválido')
        .toLowerCase(),
    password: z.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
    email: z.string()
        .email('Email inválido')
        .toLowerCase(),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    nombre: z.string().min(2, 'El nombre es requerido'),
    apellido: z.string().min(2, 'El apellido es requerido'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

// ============ USUARIOS ============
export const userSchema = z.object({
    nombre_cliente: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    apellido_cliente: z.string()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(100, 'El apellido no puede exceder 100 caracteres'),
    correo_cliente: z.string()
        .email('Email inválido')
        .toLowerCase(),
    telefono_cliente: z.string()
        .optional()
        .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
            message: 'Formato de teléfono inválido'
        }),
    pais_cliente: z.string()
        .min(2, 'Selecciona un país')
        .max(2, 'Código de país inválido'),
    ciudad_cliente: z.string().optional(),
    direccion_cliente: z.string().optional(),
    organizacion_cliente: z.string().optional(),
    empresa_cliente: z.string().optional(),
    notas: z.string().optional(),
});

// ============ LICENCIAS ============
export const licenseSchema = z.object({
    licencia_serial: z.string()
        .min(10, 'El serial debe tener al menos 10 caracteres')
        .max(100, 'El serial no puede exceder 100 caracteres'),
    licencia_tipo: z.enum(['TRIAL', 'STANDARD', 'PREMIUM', 'ENTERPRISE'], {
        errorMap: () => ({ message: 'Tipo de licencia inválido' })
    }),
    licencia_expira: z.coerce.date({
        errorMap: () => ({ message: 'Fecha de expiración inválida' })
    }),
    licencia_activa: z.boolean().default(true),
    max_usuarios: z.coerce.number()
        .int('Debe ser un número entero')
        .min(1, 'Mínimo 1 usuario')
        .max(10000, 'Máximo 10000 usuarios')
        .optional(),
    max_dispositivos: z.coerce.number()
        .int('Debe ser un número entero')
        .min(1, 'Mínimo 1 dispositivo')
        .optional(),
    notas: z.string().optional(),
});

// ============ CRM - CLIENTES ============
export const crmClientSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(200, 'El nombre no puede exceder 200 caracteres'),
    email: z.string()
        .email('Email inválido')
        .toLowerCase(),
    telefono: z.string()
        .optional()
        .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
            message: 'Formato de teléfono inválido'
        }),
    empresa: z.string().optional(),
    pais: z.string().min(2, 'Selecciona un país').optional(),
    ciudad: z.string().optional(),
    direccion: z.string().optional(),
    sitio_web: z.string()
        .url('URL inválida')
        .optional()
        .or(z.literal('')),
    notas: z.string().optional(),
    fecha_registro: z.coerce.date().optional(),
});

// ============ CRM - PROSPECTOS ============
export const prospectSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(200, 'El nombre no puede exceder 200 caracteres'),
    email: z.string()
        .email('Email inválido')
        .toLowerCase(),
    telefono: z.string().optional(),
    empresa: z.string().optional(),
    estado: z.enum(['NUEVO', 'CONTACTADO', 'CALIFICADO', 'NEGOCIACION', 'GANADO', 'PERDIDO'], {
        errorMap: () => ({ message: 'Estado inválido' })
    }),
    origen: z.enum(['WEB', 'REFERIDO', 'EVENTO', 'LLAMADA', 'EMAIL', 'OTRO'], {
        errorMap: () => ({ message: 'Origen inválido' })
    }).optional(),
    valor_estimado: z.coerce.number()
        .min(0, 'El valor no puede ser negativo')
        .optional(),
    probabilidad: z.coerce.number()
        .min(0, 'Mínimo 0%')
        .max(100, 'Máximo 100%')
        .optional(),
    fecha_contacto: z.coerce.date().optional(),
    fecha_cierre_estimada: z.coerce.date().optional(),
    notas: z.string().optional(),
});

// ============ CRM - COSTOS DE HOSTING ============
export const hostingCostSchema = z.object({
    cliente_nombre: z.string()
        .min(2, 'El nombre del cliente es requerido'),
    servidor: z.string()
        .min(2, 'El servidor es requerido'),
    dominio: z.string()
        .min(2, 'El dominio es requerido'),
    costo_mensual: z.coerce.number()
        .min(0, 'El costo no puede ser negativo'),
    moneda: z.enum(['USD', 'EUR', 'MXN', 'COP', 'ARS'], {
        errorMap: () => ({ message: 'Moneda inválida' })
    }).default('USD'),
    fecha_inicio: z.coerce.date(),
    fecha_renovacion: z.coerce.date().optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

// ============ CRM - SEGUIMIENTOS ============
export const followUpSchema = z.object({
    cliente_id: z.coerce.number().int().positive(),
    tipo: z.enum(['LLAMADA', 'EMAIL', 'REUNION', 'DEMO', 'OTRO'], {
        errorMap: () => ({ message: 'Tipo inválido' })
    }),
    fecha: z.coerce.date(),
    hora: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
    descripcion: z.string()
        .min(5, 'La descripción debe tener al menos 5 caracteres')
        .max(500, 'La descripción no puede exceder 500 caracteres'),
    completado: z.boolean().default(false),
    resultado: z.string().optional(),
});

// ============ SERVIDORES Y DOMINIOS ============
export const serverSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres'),
    ip: z.string()
        .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'IP inválida'),
    proveedor: z.string().optional(),
    ubicacion: z.string().optional(),
    costo_mensual: z.coerce.number().min(0).optional(),
    fecha_expiracion: z.coerce.date().optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

export const domainSchema = z.object({
    nombre: z.string()
        .min(3, 'El dominio debe tener al menos 3 caracteres')
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, 'Formato de dominio inválido'),
    registrador: z.string().optional(),
    fecha_registro: z.coerce.date().optional(),
    fecha_expiracion: z.coerce.date(),
    auto_renovacion: z.boolean().default(false),
    costo_anual: z.coerce.number().min(0).optional(),
    activo: z.boolean().default(true),
    notas: z.string().optional(),
});

// ============ PERFIL DE USUARIO ============
export const profileSchema = z.object({
    nombre: z.string().min(2, 'El nombre es requerido'),
    apellido: z.string().min(2, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    telefono: z.string().optional(),
    empresa: z.string().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

// Export default para compatibilidad
export default {
    loginSchema,
    registerSchema,
    userSchema,
    licenseSchema,
    crmClientSchema,
    prospectSchema,
    hostingCostSchema,
    followUpSchema,
    serverSchema,
    domainSchema,
    profileSchema,
    changePasswordSchema,
};
