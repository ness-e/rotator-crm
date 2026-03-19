/**
 * @file audit.js
 * @description Definición de rutas API para el módulo audit.
 * @module Backend Route
 * @path /backend/src/routes/audit.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/auth.js';
import { requireMaster } from '../middleware/roles.js';

const router = Router();
const prisma = new PrismaClient();

// Get all logs (paginated)
router.get('/', authRequired, requireMaster, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { fecha: 'desc' }
            }),
            prisma.auditLog.count()
        ]);

        res.json({
            data: logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching audit logs' });
    }
});

export default router;
