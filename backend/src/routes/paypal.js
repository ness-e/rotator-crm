/**
 * @file paypal.js
 * @description Definición de rutas API para el módulo paypal.
 * @module Backend Route
 * @path /backend/src/routes/paypal.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { Router } from 'express';
import PayPalService from '../services/paypal.service.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * @swagger
 * /paypal/webhook:
 *   post:
 *     summary: Webhook Listener for PayPal Events (V2)
 */
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;

        logger.info('PayPal Webhook received', { type: event.event_type, id: event.id });

        // Verify signature
        const isValid = await PayPalService.verifyPayPalWebhook(req.headers, req.body);
        if (!isValid) {
            logger.warn('Invalid PayPal Webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Handle event
        await PayPalService.handlePayPalWebhook(event);

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Error processing PayPal Webhook', { error: error.message });
        res.status(500).json({ error: 'Internal Error' });
    }
});

export default router;
