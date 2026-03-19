/**
 * @file email.service.js
 * @description Email service using Nodemailer with SMTP support
 */

import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import templates from './emailTemplates.js';

// Configuration
const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

const FROM_EMAIL = process.env.SMTP_FROM || '"Rotator Survey" <noreply@rotatorsurvey.com>';

// Create transporter
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    
    if (!process.env.SMTP_HOST) {
        logger.warn('SMTP_HOST not configured. Email service will run in MOCK mode.');
        return null;
    }

    try {
        transporter = nodemailer.createTransport(smtpConfig);
        return transporter;
    } catch (error) {
        logger.error('Failed to create email transporter', error);
        return null;
    }
}

/**
 * Envia un correo genérico
 */
export const sendEmail = async (to, subject, html) => {
    const transport = getTransporter();

    if (!transport) {
        logger.info(`[MOCK EMAIL] TO: ${to} | SUBJECT: ${subject}`);
        return true;
    }

    try {
        const info = await transport.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
        logger.info(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Error sending email to ${to}:`, error);
        return false;
    }
};

/**
 * Correo de bienvenida
 */
export const sendWelcomeEmail = async (email, name) => {
    const html = templates.welcome(name);
    return sendEmail(email, 'Bienvenido a Rotator Survey', html);
};

/**
 * Correo de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (email, code, orgName) => {
    const html = templates.passwordReset(code);
    return sendEmail(email, `Recuperación de Contraseña - ${orgName || 'Rotator'}`, html);
};

/**
 * Aviso de vencimiento de licencia
 */
export const sendLicenseExpiryWarning = async (user, license, days) => {
    const html = templates.licenseExpiry(user.fullName, license.serialKey, days);
    return sendEmail(user.email, 'Aviso de Vencimiento de Licencia', html);
};

/**
 * Confirmación de compra (PayPal)
 */
export const sendPurchaseConfirmation = async (data) => {
    const { email } = data;
    const html = templates.purchaseConfirmation(data);
    const subject = data.lang === 'en' ? 'Purchase Confirmation' : 'Confirmación de Compra';
    return sendEmail(email, subject, html);
};

export default {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendLicenseExpiryWarning,
    sendPurchaseConfirmation
};
