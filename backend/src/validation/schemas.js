/**
 * @file schemas.js
 * @description Zod validation schemas for API request validation
 * 
 * @overview
 * This module contains all Zod validation schemas used throughout the application
 * for validating API requests. Provides type-safe validation for authentication,
 * user management, licenses, organizations, and other resources.
 * 
 * @features
 * - Centralized validation schemas
 * - Type-safe validation with Zod
 * - Reusable common schemas (ParamIdSchema, passwordSchema, etc.)
 * - Strong password validation
 * - Email format validation
 * - Date format validation (YYYY-MM-DD)
 * - Custom error messages
 * 
 * @schema-categories
 * **Authentication:**
 * - AuthLoginSchema - Login credentials
 * - AuthRegisterSchema - User registration by MASTER
 * - PublicRegisterSchema - Public self-registration
 * 
 * **Users:**
 * - CreateUserSchema - Create new user
 * - UpdateUserSchema - Update existing user
 * 
 * **Licenses:**
 * - CreateLicenseSchema - Create new license
 * - UpdateLicenseSchema - Update existing license
 * 
 * **Organizations:**
 * - CreateOrganizationSchema - Create new organization
 * - UpdateOrganizationSchema - Update existing organization
 * 
 * **Common:**
 * - ParamIdSchema - Validate numeric ID in URL params
 * 
 * @usage
 * ```javascript
 * import { AuthLoginSchema, CreateUserSchema } from './validation/schemas.js';
 * import { validateBody } from './middleware/validate.js';
 * 
 * // Use in routes with validation middleware
 * router.post('/auth/login', validateBody(AuthLoginSchema), loginHandler);
 * router.post('/users', validateBody(CreateUserSchema), createUserHandler);
 * 
 * // Manual validation
 * const result = AuthLoginSchema.safeParse(req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.errors });
 * }
 * ```
 * 
 * @password-requirements
 * Strong password validation enforces:
 * - Minimum 6 characters
 * - Maximum 100 characters
 * - At least one letter (A-Z or a-z)
 * - At least one number (0-9)
 * 
 * @date-format
 * Date strings must be in YYYY-MM-DD format:
 * - Valid: "2026-01-29"
 * - Invalid: "01/29/2026", "29-01-2026"
 * 
 * @adding-schemas
 * To add new validation schemas:
 * 1. Define schema using z.object()
 * 2. Add field validations with error messages
 * 3. Export schema
 * 4. Use in routes with validateBody/validateParams
 * 5. Document in this header
 * 
 * @example-schemas
 * ```javascript
 * // Simple schema
 * export const SimpleSchema = z.object({
 *   name: z.string().min(1, 'Name required'),
 *   age: z.number().int().positive()
 * });
 * 
 * // Complex schema with custom validation
 * export const ComplexSchema = z.object({
 *   email: z.string().email(),
 *   password: passwordSchema,
 *   confirmPassword: z.string()
 * }).refine(data => data.password === data.confirmPassword, {
 *   message: 'Passwords must match',
 *   path: ['confirmPassword']
 * });
 * ```
 * 
 * @dependencies
 * - zod - Schema validation library
 * 
 * @related-files
 * - backend/src/middleware/validate.js - Uses these schemas
 * - backend/src/routes/*.js - All routes use validation
 * 
 * @module validation.schemas
 * @path /backend/src/validation/schemas.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { z } from 'zod'

// Common
export const ParamIdSchema = z.object({ id: z.coerce.number().int().positive() })

// Validación de fecha (YYYY-MM-DD)
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD')

// Validación de fortaleza de contraseña
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Auth
export const AuthLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// Registro de usuario por MASTER
export const AuthRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional()
})

// Registro público (sin autenticación)
export const PublicRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  country: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  position: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional()
})

// Users
export const UserCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().email('Invalid email format').max(255),
  password: passwordSchema.optional().or(z.literal('').transform(() => undefined)),
  position: z.string().trim().min(1).max(200).optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().trim().min(1).max(50).optional().or(z.literal('').transform(() => undefined)),
  country: z.string().trim().min(1).max(50).optional().or(z.literal('').transform(() => undefined)),
  city: z.string().trim().min(1).max(100).optional().or(z.literal('').transform(() => undefined)),
  organizationId: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  role: z.enum(['MASTER', 'ANALISTA', 'VISUALIZADOR', 'CLIENTE'], { errorMap: () => ({ message: 'Invalid role' }) }).optional()
})
export const UserUpdateSchema = UserCreateSchema.partial()

// Licenses
export const LicenseCreateSchema = z.object({
  id_cliente: z.coerce.number().int().positive('id_cliente must be a positive integer'),
  licencia_serial: z.string().min(1).max(500, 'Serial too long'),
  licencia_expira: dateStringSchema,
  licencia_tipo: z.string().min(1).max(50),
  licencia_activador: z.string().max(50).optional(),
  n_preguntas: z.coerce.number().int().min(0).max(999999).optional(),
  n_casos: z.coerce.number().int().min(0).max(999999).optional(),
  n_admins: z.coerce.number().int().min(0).max(999999).optional(),
  n_moviles: z.coerce.number().int().min(0).max(999999).optional(),
  n_telefonicos: z.coerce.number().int().min(0).max(999999).optional(),
  n_digitadores: z.coerce.number().int().min(0).max(999999).optional(),
  n_analistas: z.coerce.number().int().min(0).max(999999).optional(),
  n_clientes: z.coerce.number().int().min(0).max(999999).optional(),
  n_clasificadores: z.coerce.number().int().min(0).max(999999).optional(),
  n_supervisores_captura: z.coerce.number().int().min(0).max(999999).optional(),
  n_supervisores_kiosco: z.coerce.number().int().min(0).max(999999).optional(),
  n_participantes: z.coerce.number().int().min(0).max(999999).optional(),
  hosting: z.coerce.number().int().min(0).max(999999).optional(),
  servidor: z.coerce.number().int().min(0).max(999999).optional(),
  cuestionarios_concurrentes: z.coerce.number().int().min(0).max(999999).optional(),
  clave_activacion_encriptada: z.string().max(1000).optional(),
})
export const LicenseUpdateSchema = LicenseCreateSchema.partial()

// Generate License
export const LicenseGenerateSchema = z.object({
  fecha: z.string().min(4),
  id_version: z.coerce.number().int(),
  version_letras: z.string().min(1),
  id_hosting: z.coerce.number().int(),
  hosting_letras: z.string().min(1),
  email: z.string().email(),
  organizacion: z.string().min(1),
  activador_letras: z.string().min(1),
  pais_letras: z.string().min(1),
  admins: z.coerce.number().int(),
  tablets: z.coerce.number().int(),
  telefonicos: z.coerce.number().int(),
  dataEntries: z.coerce.number().int(),
  analizadores: z.coerce.number().int(),
  clasificadores: z.coerce.number().int(),
  supsCaptura: z.coerce.number().int(),
  supsKiosco: z.coerce.number().int(),
  clientes: z.coerce.number().int(),
  preguntas: z.coerce.number().int(),
})

export const LicenseGenerateAndCreateSchema = LicenseGenerateSchema.extend({
  id_cliente: z.coerce.number().int(),
  licencia_tipo: z.string().min(1)
})

// Regenerate License: same payload as generate, plus optional licencia_tipo
export const LicenseRegenerateSchema = LicenseGenerateSchema.extend({
  licencia_tipo: z.string().min(1).optional()
})
