/**
 * @file users.js
 * @description Rutas CRUD para gestión de usuarios del sistema
 * 
 * @usage
 * - Dónde se utiliza: Montado en /api/users en backend/src/index.js
 * - Cuándo se utiliza: Operaciones de administración de usuarios (crear, leer, actualizar, eliminar)
 * 
 * @functionality
 * - GET / - Listar todos los usuarios del sistema
 * - GET /:id - Obtener detalles de un usuario específico
 * - POST / - Crear nuevo usuario (requiere rol MASTER)
 * - PUT /:id - Actualizar usuario existente (requiere rol MASTER)
 * - DELETE /:id - Eliminar usuario (requiere rol MASTER)
 * 
 * @dependencies
 * - @prisma/client - Acceso a base de datos
 * - bcryptjs - Hash de contraseñas
 * 
 * @relatedFiles
 * - middleware/auth.js - Autenticación requerida
 * - middleware/roles.js - Verificación de rol MASTER
 * - middleware/validate.js - Validación de entrada
 * - services/audit.service.js - Auditoría de cambios
 * - prisma/schema.prisma - Modelo User
 * 
 * @module Backend Route
 * @category User Management
 * @path /backend/src/routes/users.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { ParamIdSchema } from '../validation/schemas.js'
import { logAction } from '../services/audit.service.js'
import bcrypt from 'bcryptjs'

const router = Router()

// GET /users - list all users
router.get('/', authRequired, async (req, res) => {
  const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'
  console.log('GET /users - User:', req.user.email, 'isMaster:', isMaster, 'orgId:', req.user.orgId);
  
  const where = {}
  if (!isMaster) {
    if (!req.user.orgId) {
      console.log('❌ 403: No orgId in req.user');
      return res.status(403).json({ error: 'Forbidden: No organization assigned' })
    }
    where.organizationId = req.user.orgId
    console.log('Filtering by organizationId:', where.organizationId);
  }

  const users = await prisma.user.findMany({
    where,
    include: { organization: true }
  })
  console.log('Found users count:', users.length);
  res.json(users)
})

// GET /users/:id
router.get('/:id', authRequired, validateParams(ParamIdSchema), async (req, res) => {
  const id = Number(req.validated.params.id)
  const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'

  const user = await prisma.user.findUnique({
    where: { id },
    include: { organization: true }
  })

  if (!user) return res.status(404).json({ error: 'User not found' })

  // Check access
  if (!isMaster && user.organizationId !== req.user.orgId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access users from other organizations' })
  }

  res.json(user)
})

// POST /users
router.post('/', authRequired, async (req, res) => {
  try {
    const data = req.body
    const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'

    // RBAC: Non-masters can only create users for their own organization
    let targetOrgId = (data.organizationId && !isNaN(Number(data.organizationId))) ? Number(data.organizationId) : null
    
    console.log('POST /users - User:', req.user.email, 'isMaster:', isMaster, 'targetOrgId:', targetOrgId);

    if (!isMaster) {
      if (!req.user.orgId) {
        console.log('❌ 403 POST: No orgId in req.user');
        return res.status(403).json({ error: 'Forbidden: No organization assigned' })
      }
      targetOrgId = req.user.orgId
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(data.password || 'Rotator2026', salt)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        position: data.position,
        phone: data.phone,
        role: data.role || 'MEMBER',
        organizationId: targetOrgId,
        isActive: data.isActive === 'false' ? false : true
      },
      include: { organization: true }
    })

    // Log
    logAction({
      req,
      action: 'CREATE',
      entity: 'Usuario',
      entityId: String(user.id),
      entityName: user.email,
      details: `Usuario creado para Org ${user.organization?.name || 'N/A'}`
    })

    res.status(201).json(user)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
    res.status(400).json({ error: e.message })
  }
})

// PUT /users/:id
router.put('/:id', authRequired, validateParams(ParamIdSchema), async (req, res) => {
  const id = Number(req.validated.params.id)
  const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'
  
  try {
    const data = req.body
    
    // 1. Fetch existing user to check ownership
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) return res.status(404).json({ error: 'User not found' })

    if (!isMaster && existingUser.organizationId !== req.user.orgId) {
      return res.status(403).json({ error: 'Forbidden: Cannot edit users from other organizations' })
    }

    // Filter data to only include valid User fields
    const allowedFields = ['email', 'password', 'fullName', 'position', 'phone', 'country', 'city', 'organizationId', 'role', 'isActive']
    const updateData = {}
    
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = data[key]
      }
    })

    // RBAC: Non-masters cannot change organizationId
    if (!isMaster && updateData.organizationId !== undefined) {
      delete updateData.organizationId
    } else if (updateData.organizationId !== undefined) {
      const orgId = Number(updateData.organizationId)
      updateData.organizationId = isNaN(orgId) || updateData.organizationId === '' ? null : orgId
    }

    if (updateData.isActive !== undefined) {
      updateData.isActive = String(updateData.isActive) === 'true'
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    logAction({
      req,
      action: 'UPDATE',
      entity: 'Usuario',
      entityId: String(id),
      entityName: user.email,
      details: 'Usuario actualizado'
    })

    res.json(user)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' })
    res.status(400).json({ error: e.message })
  }
})

// DELETE /users/:id
router.delete('/:id', authRequired, validateParams(ParamIdSchema), async (req, res) => {
  const id = Number(req.validated.params.id)
  const isMaster = req.user.tipo === 'MASTER' || req.user.role === 'MASTER' || req.user.role === 'SUPER_ADMIN'

  try {
    // 1. Fetch existing user to check ownership
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) return res.status(404).json({ error: 'User not found' })

    if (!isMaster && existingUser.organizationId !== req.user.orgId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete users from other organizations' })
    }

    const user = await prisma.user.delete({ where: { id } })

    logAction({
      req,
      action: 'DELETE',
      entity: 'Usuario',
      entityId: String(id),
      entityName: user.email,
      details: 'Usuario eliminado'
    })

    res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' })
    res.status(400).json({ error: e.message })
  }
})

export default router
