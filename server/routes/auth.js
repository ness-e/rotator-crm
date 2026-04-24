/**
 * @file auth.js
 * @description Rutas de autenticación para usuarios y organizaciones del sistema
 */

import { Router } from 'express';
import { prisma } from '../config/prismaClient.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs'
import { validateBody } from '../middleware/validate.js'
import { AuthLoginSchema, AuthRegisterSchema, PublicRegisterSchema } from '../validation/schemas.js'
import { authRequired } from '../middleware/auth.js'
import { requireMaster } from '../middleware/roles.js'
import { z } from 'zod'
import { logAction } from '../services/audit.service.js'
import { sendPasswordResetEmail } from '../services/email.service.js'

const router = Router();

router.post('/login', validateBody(AuthLoginSchema), async (req, res) => {
  try {
    const { email: rawEmail, password } = req.validated.body;
    const email = (rawEmail || '').trim().toLowerCase();

    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    // Try User Login
    let user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (user) {
      if (!user.isActive) return res.status(403).json({ error: 'User is inactive' });

      const stored = user.password || ''
      const isHash = stored.startsWith('$2') || stored.startsWith('$argon2');

      let ok = false
      if (isHash) {
        ok = await bcrypt.compare(password, stored)
      } else {
        ok = (password === stored)
        if (ok) {
           const hash = await bcrypt.hash(password, 10)
           await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
        }
      }

      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }).catch(() => {})

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const payload = {
        id: user.id,
        type: 'USER',
        tipo: user.role === 'MASTER' ? 'MASTER' : 'USER',
        role: user.role,
        nombre: fullName,
        email: user.email,
        orgId: user.organizationId
      }

      logAction({
        userId: user.id,
        userEmail: user.email,
        userName: fullName,
        action: 'LOGIN',
        entity: 'User',
        entityId: String(user.id),
        entityName: fullName,
        details: 'Inicio de sesión exitoso',
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress
      })

      return res.json({ token: signToken(payload), refreshToken: signRefreshToken(payload) });
    }

    // Try Org Login
    const org = await prisma.organization.findUnique({
      where: { email },
      include: { _count: { select: { users: true, licenses: true } } }
    });

    if (org && org.isActive && org.password) {
      if (await bcrypt.compare(password, org.password)) {
        const payload = { id: org.id, type: 'ORGANIZATION', name: org.name, email: org.email, orgId: org.id, isMaster: org.isMaster };
        return res.json({ token: signToken(payload), refreshToken: signRefreshToken(payload) });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', authRequired, requireMaster, validateBody(AuthRegisterSchema), async (req, res) => {
  try {
    const data = req.validated.body
    const exists = await prisma.user.findFirst({ where: { email: data.email } })
    if (exists) return res.status(409).json({ error: 'User already exists' })
    const hash = await bcrypt.hash(data.password, 10)
    const created = await prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: data.role || 'MEMBER',
        isActive: true
      }
    })
    res.status(201).json({ id: created.id })
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/register-public', validateBody(PublicRegisterSchema), async (req, res) => {
  try {
    const data = req.validated.body;
    const exists = await prisma.user.findFirst({ where: { email: data.email } })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: 'MEMBER',
        isActive: true,
      }
    })

    res.status(201).json({
      token: signToken({ id: user.id, email: user.email, role: user.role }),
      refreshToken: signRefreshToken({ id: user.id }),
      message: 'Registration successful'
    })
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' })
  try {
    const payload = verifyRefreshToken(refreshToken)
    return res.json({ token: signToken({ id: payload.id, tipo: payload.tipo }) })
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', (req, res) => res.json({ ok: true }))

const passwordResetCodes = new Map();

router.post('/forgot-password', validateBody(z.object({ email: z.string().email() })), async (req, res) => {
  try {
    const { email } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true, message: 'Si el email existe, se enviará un código' });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    passwordResetCodes.set(email, { code, expires: Date.now() + 15 * 60 * 1000 });

    await sendPasswordResetEmail(email, code);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', validateBody(z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8)
})), async (req, res) => {
  try {
    const { email, code, newPassword } = req.validated.body;
    const stored = passwordResetCodes.get(email);
    if (!stored || stored.expires < Date.now() || stored.code !== code) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    passwordResetCodes.delete(email);

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
