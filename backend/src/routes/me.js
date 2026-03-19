/**
 * @file me.js
 * @description Definición de rutas API para el módulo me (Perfil de Usuario).
 * @module Backend Route
 * @path /backend/src/routes/me.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { prisma } from '../config/prismaClient.js';
import { validateBody } from '../middleware/validate.js';
import { UserUpdateSchema } from '../validation/schemas.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

// Helper to map User+Organization to Legacy format
const mapUserToLegacy = (user) => {
  if (!user) return null;

  const names = (user.fullName || '').split(' ');
  const nombre = names[0] || '';
  const apellido = names.slice(1).join(' ') || '';

  // Get license from Organization if user has no direct one (B2B logic)
  // We assume the first license of the org is the "main" one for the dashboard of a member
  const license = user.organization?.licenses?.[0] || null;

  return {
    ...user,
    // ID mapping
    id_cliente: user.id, // For legacy frontend compatibility
    // Personal Info
    nombre_cliente: nombre,
    apellido_cliente: apellido,
    correo_cliente: user.email,
    password_cliente: user.password, // Ideally shouldn't return this, but legacy might expect existence key

    // Organization Info (from relation)
    organizacion_cliente: user.organization?.name || '',
    pais_cliente: user.organization?.countryCode || '',
    ciudad_cliente: user.organization?.city || '',
    direccion_cliente: user.organization?.address || '',
    telefono_cliente: user.organization?.phone || user.phone || '', // Fallback to user phone

    // Counts
    unreadNotifications: user.notifications ? user.notifications.filter(n => !n.read).length : 0,

    // License relation (if included in query)
    license: license ? {
      ...license,
      licencia_serial: license.serialKey,
      licencia_expira: license.expirationDate ? new Date(license.expirationDate).toISOString().split('T')[0] : 'Vitalicia',
      licencia_tipo: license.productTemplateId || 'UNKNOWN', // simplistic
      n_preguntas: license.limitQuestions,
      n_casos: license.limitCases,
      n_admins: license.limitAdmins,
      n_moviles: license.limitMobileUsers,
      n_telefonicos: license.limitPhoneUsers,
      hosting: license.serverNodeId ? 1 : 0 // Rough guess
    } : null
  };
};

// GET /me - Obtener perfil del usuario autenticado
router.get('/', authRequired, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: {
        organization: {
          include: {
            licenses: { take: 1 } // Now fetching via Organization
          }
        },
        notifications: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Not found' });

    const legacyUser = mapUserToLegacy(user);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(legacyUser);
  } catch (e) {
    console.error('Error in GET /me:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /me - Actualizar perfil del usuario autenticado
router.put('/', authRequired, validateBody(UserUpdateSchema), async (req, res) => {
  const id = req.user.id;
  try {
    const data = req.validated.body;

    // 1. Prepare User Data (fullName)
    const { nombre_cliente, apellido_cliente } = data;
    let updateUserData = {};
    if (nombre_cliente || apellido_cliente) {
      // Need to fetch current name if only one part provided? 
      // Or assume frontend sends both if editing profile. Layout usually sends full form.
      // Let's assume simplest case: build fullName from provided or existing.
      // Better: Fetch current first to merge properly if partial update.
      // Since schema is partial, we should fetch.
      const current = await prisma.user.findUnique({ where: { id } });
      const currentNames = (current.fullName || '').split(' ');
      const newFirst = nombre_cliente ?? currentNames[0] ?? '';
      const newLast = apellido_cliente ?? currentNames.slice(1).join(' ') ?? '';
      updateUserData.fullName = `${newFirst} ${newLast}`.trim();
    }

    if (data.telefono_cliente) {
      updateUserData.phone = data.telefono_cliente;
    }

    // 2. Prepare Organization Data
    const { organizacion_cliente, pais_cliente, ciudad_cliente, direccion_cliente } = data;
    let updateOrgData = {};
    if (organizacion_cliente) updateOrgData.name = organizacion_cliente;
    if (pais_cliente) updateOrgData.countryCode = pais_cliente;
    if (ciudad_cliente) updateOrgData.city = ciudad_cliente;
    if (direccion_cliente) updateOrgData.address = direccion_cliente;

    // 3. Perform Updates
    // Update User
    let user = await prisma.user.update({
      where: { id },
      data: updateUserData,
      include: { organization: true } // to get org ID
    });

    // Update Organization (if user has one and data provided)
    if (user.organizationId && Object.keys(updateOrgData).length > 0) {
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: updateOrgData
      });
    }

    // 4. Return new state (fetched fresh to be safe and mapped)
    const freshUser = await prisma.user.findUnique({
      where: { id },
      include: { organization: true, notifications: true, licenses: { take: 1 } }
    });

    res.json(mapUserToLegacy(freshUser));

  } catch (e) {
    console.error('Error in PUT /me:', e);
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});

// PUT /me/password - Cambiar contraseña
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

router.put('/password', authRequired, validateBody(PasswordChangeSchema), async (req, res) => {
  const id = req.user.id;
  try {
    const { currentPassword, newPassword } = req.validated.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current (bcrypt)
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Update
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hash }
    });

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});

export default router;
