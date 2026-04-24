/**
 * @file invitations.js
 * @description API routes for managing secure token-based user/org invitations.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prismaClient.js';
import { authRequired } from '../middleware/auth.js';
import { requireMaster } from '../middleware/roles.js';
import { logAction } from '../services/audit.service.js';
import logger from '../config/logger.js';
import { sendInvitationEmail } from '../services/email.service.js';

const router = Router();

// ==========================================
// 1. Generate Invitation Link
// ==========================================
// POST /api/invitations
router.post('/', authRequired, requireMaster, async (req, res) => {
  try {
    const { email, productTemplateId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required to dispatch the invitation' });
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists in the system.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Create Invitation in LicenciaEnActivacion
    const invitation = await prisma.licenciaEnActivacion.create({
      data: {
        email,
        token,
        productTemplateId: productTemplateId ? Number(productTemplateId) : null,
        status: 'PENDING'
      }
    });

    logAction({ 
      req, 
      action: 'CREATE', 
      entity: 'Invitation', 
      entityId: invitation.id, 
      entityName: email, 
      details: `Generated invitation token for ${email}` 
    });

    // Determine the frontend domain
    // Normally it's FRONTEND_ORIGIN from env, or derived from request
    const origin = process.env.FRONTEND_ORIGIN || req.get('origin') || 'http://localhost:5180';
    const link = `${origin}/register?token=${token}`;

    logger.info(`Invitation generated for ${email}: ${link}`);

    // Dispatch Email using email.service.js
    const emailSent = await sendInvitationEmail(email, link);
    if (!emailSent) {
      logger.warn(`Failed to dispatch email to ${email}, but invitation was created.`);
    }

    res.json({ 
      success: true, 
      message: 'Invitation generated successfully',
      link, 
      invitation 
    });
  } catch (error) {
    logger.error('Error generating invitation', error);
    res.status(500).json({ error: 'Internal server error while generating invitation' });
  }
});

// ==========================================
// 2. Validate Invitation Token
// ==========================================
// GET /api/invitations/:token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.licenciaEnActivacion.findUnique({
      where: { token }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'This invitation has already been consumed' });
    }

    // Return the pre-fill details
    res.json({
      success: true,
      email: invitation.email,
      productTemplateId: invitation.productTemplateId
    });
  } catch (error) {
    logger.error('Error validating invitation token', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 3. Accept Invitation & Create Profile
// ==========================================
// POST /api/invitations/:token/accept
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Organization fields
    const { organizationName, commercialName, organizationPhone } = req.body;
    
    // User fields
    const { firstName, lastName, phone, password } = req.body;

    if (!organizationName || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Missing required profile fields' });
    }

    // Fetch and validate invitation
    const invitation = await prisma.licenciaEnActivacion.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const { email, productTemplateId } = invitation;

    // Start a transaction to ensure atomic creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          taxId: commercialName || null,
          phone: organizationPhone || null,
          source: 'INVITATION',
          clientType: 'C',
          adminContactName: firstName,
          adminContactLastName: lastName,
          adminContactEmail: email
        }
      });

      // 2. Hash password & Create User
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash(password, 10);

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'CLIENTE',
          organizationId: org.id
        }
      });

      // 3. Create License if productTemplateId is provided
      let license = null;
      if (productTemplateId) {
        // Simple Serial logic consistent with previous flows
        const serial = `PRO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        license = await tx.license.create({
          data: {
            serialKey: serial,
            organizationId: org.id,
            productTemplateId,
            status: 'ACTIVE',
            limitQuestions: 100, // Or whatever default is applicable
            limitCases: 1000,
            limitAdmins: 1,
            ownedByUserId: user.id
          }
        });
      }

      // 4. Mark Invitation as Accepted
      await tx.licenciaEnActivacion.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      return { org, user, license };
    });

    logger.info(`Invitation ${token} successfully accepted by ${email}. Org ID: ${result.org.id}, User ID: ${result.user.id}`);

    res.json({
      success: true,
      message: 'Registration completed successfully',
      organizationId: result.org.id,
      userId: result.user.id,
      licenseId: result.license?.id
    });
  } catch (error) {
    logger.error('Error accepting invitation', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This email is already in use' });
    }
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});
// ==========================================
// 4. List All Invitations (For Inbox)
// ==========================================
// GET /api/invitations
router.get('/', authRequired, requireMaster, async (req, res) => {
  try {
    const rawInvitations = await prisma.licenciaEnActivacion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Manual join to avoid schema changes
    const templates = await prisma.productTemplate.findMany({
      select: { id: true, name: true }
    });
    const templateMap = templates.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});

    const invitations = rawInvitations.map(inv => ({
      ...inv,
      productTemplate: inv.productTemplateId ? templateMap[inv.productTemplateId] : null
    }));

    res.json(invitations);
  } catch (error) {
    logger.error('Error fetching invitations', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 5. Delete Invitation
// ==========================================
// DELETE /api/invitations/:id
router.delete('/:id', authRequired, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.licenciaEnActivacion.delete({
      where: { id }
    });
    
    logAction({ 
      req, 
      action: 'DELETE', 
      entity: 'Invitation', 
      entityId: id, 
      details: `Deleted invitation ${id}` 
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting invitation', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
