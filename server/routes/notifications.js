/**
 * @file notifications.js
 * @description Definición de rutas API para el módulo notifications.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import NotificationService from '../services/notification.service.js'
import { validateParams } from '../middleware/validate.js'
import { z } from 'zod'

const router = Router()

// GET /notifications - Obtener notificaciones del usuario autenticado
router.get('/', authRequired, async (req, res) => {
  try {
    const userId = req.user.id
    const unreadOnly = req.query.unreadOnly === 'true'
    const limit = req.query.limit ? parseInt(req.query.limit) : 50
    const offset = req.query.offset ? parseInt(req.query.offset) : 0
    
    const notifications = await NotificationService.getUserNotifications(userId, { 
      unreadOnly, 
      limit, 
      offset 
    })
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// GET /notifications/unread-count - Contar notificaciones no leídas
router.get('/unread-count', authRequired, async (req, res) => {
  try {
    const userId = req.user.id
    const count = await NotificationService.getUnreadCount(userId)
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: 'Failed to count notifications' })
  }
})

// PUT /notifications/:id/read - Marcar notificación como leída
router.put('/:id/read', authRequired, validateParams(z.object({ id: z.coerce.number() })), async (req, res) => {
  try {
    const userId = req.user.id
    const notificationId = parseInt(req.params.id)
    const success = await NotificationService.markAsRead(userId, notificationId)
    
    if (success) {
      res.json({ ok: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// PUT /notifications/read-all - Marcar todas como leídas
router.put('/read-all', authRequired, async (req, res) => {
  try {
    const userId = req.user.id
    const count = await NotificationService.markAllAsRead(userId)
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// DELETE /notifications/:id - Eliminar notificación
router.delete('/:id', authRequired, validateParams(z.object({ id: z.coerce.number() })), async (req, res) => {
  try {
    const userId = req.user.id
    const notificationId = parseInt(req.params.id)
    const success = await NotificationService.deleteNotification(userId, notificationId)
    
    if (success) {
      res.status(204).end()
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
