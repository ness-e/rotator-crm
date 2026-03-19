/**
 * @file notification.service.js
 * @description In-app notification system aligned with Prisma schema
 */

import { prisma } from '../config/prismaClient.js';

/**
 * Tipos de notificaciones
 */
export const NOTIFICATION_TYPES = {
    PURCHASE_COMPLETED: 'PURCHASE_COMPLETED',
    LICENSE_ACTIVATED: 'LICENSE_ACTIVATED',
    LICENSE_EXPIRING: 'LICENSE_EXPIRING',
    LICENSE_EXPIRED: 'LICENSE_EXPIRED',
    ACTIVATION_REMOVED: 'ACTIVATION_REMOVED',
    WELCOME: 'WELCOME',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
};

/**
 * Crea una notificación para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} type - Tipo de notificación
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @param {Object} metadata - Datos adicionales (opcional)
 */
export async function createNotification(userId, type, title, message, metadata = null) {
    try {
        const uId = Number(userId);
        
        // Manage limit (keep 100 max)
        const count = await prisma.notification.count({ where: { userId: uId } });
        if (count >= 100) {
            const oldest = await prisma.notification.findFirst({
                where: { userId: uId },
                orderBy: { createdAt: 'asc' }
            });
            if (oldest) {
                await prisma.notification.delete({ where: { id: oldest.id } });
            }
        }

        const notification = await prisma.notification.create({
            data: {
                userId: uId,
                type: type || 'info',
                title: title || 'Notificación',
                message: message,
                metadata: metadata ? JSON.stringify(metadata) : null,
                read: false,
                createdAt: new Date(),
            },
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(userId, notificationId) {
    try {
        const nId = Number(notificationId);
        const uId = Number(userId);

        // Ensure ownership
        const exists = await prisma.notification.findFirst({
            where: { id: nId, userId: uId }
        });
        if (!exists) return false;

        await prisma.notification.update({
            where: { id: nId },
            data: { read: true },
        });
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllAsRead(userId) {
    try {
        const uId = Number(userId);
        const result = await prisma.notification.updateMany({
            where: { userId: uId, read: false },
            data: { read: true },
        });
        return result.count;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return 0;
    }
}

/**
 * Elimina una notificación
 */
export async function deleteNotification(userId, notificationId) {
    try {
        const nId = Number(notificationId);
        const uId = Number(userId);

        const exists = await prisma.notification.findFirst({
            where: { id: nId, userId: uId }
        });
        if (!exists) return false;

        await prisma.notification.delete({
            where: { id: nId },
        });
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

/**
 * Obtiene el conteo de notificaciones no leídas de un usuario
 */
export async function getUnreadCount(userId) {
    try {
        const uId = Number(userId);
        return await prisma.notification.count({
            where: { userId: uId, read: false },
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getUserNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    const uId = Number(userId);

    try {
        const where = {
            userId: uId,
            ...(unreadOnly && { read: false }),
        };

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return notifications.map(n => ({
            ...n,
            metadata: n.metadata ? JSON.parse(n.metadata) : {}
        }));
    } catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
}

/**
 * Notificaciones automáticas
 */

export async function notifyPurchaseCompleted(userId, productName, txnId) {
    const title = 'Compra Completada';
    const message = `Su compra de ${productName} ha sido procesada con éxito. ID Transacción: ${txnId}`;
    return createNotification(userId, NOTIFICATION_TYPES.PURCHASE_COMPLETED, title, message, {
        productName,
        txnId,
    });
}

export async function notifyLicenseActivated(userId, serial) {
    const title = 'Licencia Activada';
    const message = `Su licencia ${serial} ha sido activada correctamente.`;
    return createNotification(userId, NOTIFICATION_TYPES.LICENSE_ACTIVATED, title, message, {
        serial,
    });
}

export async function notifyLicenseExpiring(userId, serial, daysRemaining) {
    const title = 'Licencia por Vencer';
    const message = `Su licencia ${serial} vencerá en ${daysRemaining} días.`;
    return createNotification(userId, NOTIFICATION_TYPES.LICENSE_EXPIRING, title, message, {
        serial,
        daysRemaining,
    });
}

export async function notifyLicenseExpired(userId, serial) {
    const title = 'Licencia Vencida';
    const message = `Su licencia ${serial} ha expirado.`;
    return createNotification(userId, NOTIFICATION_TYPES.LICENSE_EXPIRED, title, message, {
        serial,
    });
}

export async function notifyActivationRemoved(userId, computerName) {
    const title = 'Activación Removida';
    const message = `Se ha removido una activación del equipo: ${computerName}`;
    return createNotification(userId, NOTIFICATION_TYPES.ACTIVATION_REMOVED, title, message, {
        computerName,
    });
}

export async function notifyWelcome(userId, name) {
    const title = '¡Bienvenido!';
    const message = `Hola ${name}, bienvenido a Rotator Survey. Tu cuenta ha sido creada con éxito.`;
    return createNotification(userId, NOTIFICATION_TYPES.WELCOME, title, message);
}

export default {
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    getUserNotifications,
    notifyPurchaseCompleted,
    notifyLicenseActivated,
    notifyLicenseExpiring,
    notifyLicenseExpired,
    notifyActivationRemoved,
    notifyWelcome,
    NOTIFICATION_TYPES,
};
