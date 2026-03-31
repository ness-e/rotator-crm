import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// =======================
// PROVIDERS CRUD
// =======================

// GET all providers
router.get('/', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      include: {
        plans: {
          where: { isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET specific provider
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id) },
      include: {
        plans: {
          where: { isActive: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST Create provider
router.post('/', async (req, res) => {
  try {
    const { name, website, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        website,
        notes,
        isActive: true
      }
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating provider:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un proveedor con este nombre' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT Update provider
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, notes, isActive } = req.body;

    const provider = await prisma.provider.update({
      where: { id: parseInt(id) },
      data: {
        name,
        website,
        notes,
        isActive
      }
    });

    res.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE (Soft delete) provider
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it has active servers
    const activeServers = await prisma.serverNode.count({
      where: { providerId: parseInt(id), status: 'active' }
    });

    if (activeServers > 0) {
      return res.status(400).json({ error: 'No se puede eliminar porque hay servidores activos usando este proveedor' });
    }

    await prisma.provider.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ message: 'Proveedor desactivado correctamente' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =======================
// PROVIDER PLANS CRUD
// =======================

// POST Create Plan
router.post('/:providerId/plans', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { name, specs, costMonthly, costAnnual, currency } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del plan es requerido' });
    }

    const plan = await prisma.providerPlan.create({
      data: {
        name,
        specs,
        costMonthly: costMonthly ? Number(costMonthly) : 0,
        costAnnual: costAnnual ? Number(costAnnual) : 0,
        currency: currency || 'USD',
        providerId: parseInt(providerId),
        isActive: true
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating provider plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT Update Plan
router.put('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, specs, isActive, costMonthly, costAnnual, currency } = req.body;

    const plan = await prisma.providerPlan.update({
      where: { id: parseInt(planId) },
      data: {
        name,
        specs,
        isActive,
        costMonthly: costMonthly !== undefined ? Number(costMonthly) : undefined,
        costAnnual: costAnnual !== undefined ? Number(costAnnual) : undefined,
        currency: currency || undefined
      }
    });

    res.json(plan);
  } catch (error) {
    console.error('Error updating provider plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE (Soft delete) Plan
router.delete('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if there are active servers using this plan
    const activeServers = await prisma.serverNode.count({
      where: { providerPlanId: parseInt(planId), status: 'active' }
    });

    if (activeServers > 0) {
      return res.status(400).json({ error: 'No se puede eliminar porque hay servidores activos usando este plan' });
    }

    await prisma.providerPlan.update({
      where: { id: parseInt(planId) },
      data: { isActive: false }
    });

    res.json({ message: 'Plan de proveedor desactivado correctamente' });
  } catch (error) {
    console.error('Error deleting provider plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
