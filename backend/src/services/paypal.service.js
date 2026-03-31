/**
 * @file paypal.service.js
 * @description PayPal processing service (IPN & Webhooks)
 */

import { prisma } from '../config/prismaClient.js';
import { sendPurchaseConfirmation } from './email.service.js';
import { MagicLinkService } from './MagicLinkService.js';
import logger from '../config/logger.js';

/**
 * Mapea el código de producto de PayPal a la letra de versión de licencia
 */
export const PRODUCT_VERSION_MAP = {
    '003': 'AC',      // Académica
    '312': '',        // CATI Basic
    '401': '',        // CAPI Basic
    '311': '',        // CAWI Basic
    '77': '',         // PAPI Basic
    '81': '',         // CAWI Basic (suscripción mensual)
    '82': '',         // PAPI Basic (suscripción mensual)
    '83': '',         // CATI Basic (suscripción mensual)
    '84': '',         // CAPI Basic (suscripción mensual)
    'RSEP': 'EN',     // Enterprise Plan
    'RSTP': 'FX',     // Teams Plan
    'RSTBP': 'TB',    // Team Basic Plan
    'RSTPP': 'TP',    // Team Premier Plan
    'RSIP': 'IN',     // Individuals Plan
    '555': 'AC',      // Test
};

/**
 * Detecta el idioma basado en el código de país de 2 letras
 */
function detectLanguageByCountry(countryCode) {
    const countryCodeUpper = (countryCode || '').toUpperCase();
    const spanish = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ'];
    if (spanish.includes(countryCodeUpper)) return 'es';
    const portuguese = ['BR', 'PT', 'AO', 'MZ', 'GW', 'TL', 'GQ', 'MO', 'CV', 'ST'];
    if (portuguese.includes(countryCodeUpper)) return 'pt';
    const french = ['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'CI', 'CM', 'CD', 'MG', 'ML', 'NE', 'SN', 'TD', 'BF', 'BJ', 'TG', 'CF', 'CG', 'GA', 'GN', 'HT'];
    if (french.includes(countryCodeUpper)) return 'fr';
    return 'en';
}

/**
 * Procesa Webhooks de PayPal (V2)
 */
export async function handlePayPalWebhook(event) {
    const eventType = event.event_type;
    logger.info(`Processing PayPal Webhook: ${eventType}`, { id: event.id });

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const payerEmail = resource.payer?.email_address;
        const payerName = `${resource.payer?.name?.given_name} ${resource.payer?.name?.surname}`;
        const amount = resource.amount?.value;
        const orderId = resource.id;
        const customId = resource.custom_id; // Product name or metadata

        // 1. Check if user exists
        const user = await prisma.user.findUnique({ 
            where: { email: payerEmail },
            include: { organization: true }
        });

        if (user) {
            logger.info(`User ${payerEmail} found. Creating license directly.`);
            const serial = `PRO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
            
            await prisma.license.create({
                data: {
                    serialKey: serial,
                    organizationId: user.organizationId,
                    status: 'ACTIVE',
                    limitQuestions: 100,
                    limitCases: 1000,
                    limitAdmins: 1,
                    purchaseDate: new Date(),
                    paypalSubId: orderId
                }
            });

            // TODO: notifyLicenseCreatedInApp
        } else {
            logger.info(`New user ${payerEmail}. Creating PurchaseIntent for Magic Link.`);
            await MagicLinkService.createIntentAndSendLink({
                email: payerEmail,
                name: payerName,
                productCode: customId || 'ROTATOR_PRO_AUTO',
                paypalOrderId: orderId,
                amount: Number(amount)
            });
        }
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
        // TODO: Handle subscription cancellation
        logger.info('Subscription cancelled event received');
    }
}

/**
 * Procesa PayPal IPN (Legacy V1)
 */
export async function processPayPalIPN(ipnData) {
    try {
        const {
            txn_id, payment_status, item_number, item_number1,
            item_name, item_name1, first_name, last_name,
            payer_email, address_country_code, residence_country
        } = ipnData;

        if (payment_status !== 'Completed') return { success: false, reason: 'Not completed' };

        const productCode = item_number1 || item_number;
        const versionLetra = PRODUCT_VERSION_MAP[productCode];
        
        if (versionLetra === undefined) return { success: false, reason: 'Unknown product' };
        if (versionLetra === '') return { success: true, reason: 'No license needed' };

        const transactionId = (txn_id === 'SISTEMA' ? `SYS-${Date.now()}` : txn_id).toUpperCase();

        try {
            const { randomBytes } = await import('crypto');
            await prisma.licenciaEnActivacion.create({
                data: {
                    id: transactionId,
                    token: randomBytes(32).toString('hex'),
                    email: payer_email.toUpperCase(),
                    status: 'PENDING'
                }
            });
        } catch (e) {
            if (e.code !== 'P2002') throw e;
        }

        const lang = detectLanguageByCountry(address_country_code || residence_country);
        const productName = item_name1 || item_name || 'Rotator Survey License';

        await sendPurchaseConfirmation({
            email: payer_email,
            firstName: first_name || '',
            lastName: last_name || '',
            productName,
            txnId: transactionId,
            versionLetra,
            lang
        });

        return { success: true, transactionId };
    } catch (error) {
        logger.error('Error processing PayPal IPN', error);
        throw error;
    }
}

/**
 * Verifica la firma del webhook con PayPal API V2
 */
export async function verifyPayPalWebhook(headers, body) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        logger.warn('PAYPAL_WEBHOOK_ID not configured. Signature verification skipped (DEVELOPMENT ONLY)');
        return true; 
    }

    try {
        const { getAccessToken } = await import('../config/paypalClient.js');
        const axios = (await import('axios')).default;
        
        const accessToken = await getAccessToken();
        const mode = process.env.PAYPAL_MODE || 'sandbox';
        const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        const verificationData = {
            transmission_id: headers['paypal-transmission-id'],
            transmission_time: headers['paypal-transmission-time'],
            cert_url: headers['paypal-cert-url'],
            auth_algo: headers['paypal-auth-algo'],
            transmission_sig: headers['paypal-transmission-sig'],
            webhook_id: webhookId,
            webhook_event: body
        };

        const response = await axios.post(
            `${baseUrl}/v1/notifications/verify-webhook-signature`,
            verificationData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const isValid = response.data?.verification_status === 'SUCCESS';
        
        if (!isValid) {
            logger.warn('PayPal Webhook signature verification failed', { 
                status: response.data?.verification_status,
                id: body.id 
            });
        }

        return isValid;
    } catch (error) {
        logger.error('Error verifying PayPal Webhook signature', {
            message: error.message,
            response: error.response?.data
        });
        // En producción retornar false, en dev tal vez true según conveniencia
        return process.env.NODE_ENV !== 'production';
    }
}

export default {
    handlePayPalWebhook,
    processPayPalIPN,
    verifyPayPalWebhook,
    PRODUCT_VERSION_MAP
};
