/**
 * @file emailTemplates.js
 * @description Generador de plantillas HTML para correos transaccionales
 */

const APP_NAME = 'Rotator Survey';
const ACCENT_COLOR = '#3B82F6';
const FOOTER_TEXT = '© 2026 Rotator Survey. Todos los derechos reservados.';

/**
 * Layout base para todos los correos
 */
const baseLayout = (content, title) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: ${ACCENT_COLOR}; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px; }
        .footer { background-color: #f9f9f9; color: #777; padding: 20px; text-align: center; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${ACCENT_COLOR}; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .details { background-color: #f1f5f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${ACCENT_COLOR}; }
        h1 { margin: 0; font-size: 24px; }
        p { margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${APP_NAME}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>${FOOTER_TEXT}</p>
        </div>
    </div>
</body>
</html>
`;

export const templates = {
    /**
     * Bienvenida (Welcome)
     */
    welcome: (name) => baseLayout(`
        <h2>¡Bienvenido, ${name}!</h2>
        <p>Gracias por unirte a Rotator Survey. Estamos encantados de tenerte con nosotros.</p>
        <p>Tu cuenta ha sido creada con éxito. Ahora puedes acceder a todas nuestras herramientas de investigación de mercados y procesamiento de encuestas.</p>
        <a href="${process.env.FRONTEND_URL}" class="button">Ir al Dashboard</a>
    `, 'Bienvenido a Rotator Survey'),

    /**
     * Restablecer Contraseña
     */
    passwordReset: (code) => baseLayout(`
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${ACCENT_COLOR}; margin: 20px 0;">
            ${code}
        </div>
        <p>Este código expirará en 15 minutos. Si no has solicitado este cambio, por favor ignora este correo.</p>
    `, 'Restablecer Contraseña'),

    /**
     * Aviso de Vencimiento de Licencia
     */
    licenseExpiry: (name, serial, days) => baseLayout(`
        <h2>Aviso de Vencimiento</h2>
        <p>Hola ${name},</p>
        <p>Te informamos que tu licencia está próxima a vencer.</p>
        <div class="details">
            <strong>Licencia:</strong> ${serial}<br>
            <strong>Expira en:</strong> ${days} días
        </div>
        <p>Para evitar interrupciones en el servicio, te recomendamos renovar tu licencia lo antes posible.</p>
        <a href="${process.env.FRONTEND_URL}/billing" class="button">Renovar Licencia</a>
    `, 'Aviso de Vencimiento de Licencia'),

    /**
     * Confirmación de Compra (PayPal)
     */
    purchaseConfirmation: (data) => {
        const { firstName, productName, txnId, serial, lang = 'es' } = data;
        
        const texts = {
            es: {
                title: 'Confirmación de Compra',
                greeting: `Hola ${firstName},`,
                msg: `Gracias por adquirir <strong>${productName}</strong>.`,
                details: 'Detalles de tu compra:',
                txn: 'ID Transacción:',
                serial: 'Número de Serie:',
                footer: 'Conserva este correo para tus registros.'
            },
            en: {
                title: 'Purchase Confirmation',
                greeting: `Hello ${firstName},`,
                msg: `Thank you for purchasing <strong>${productName}</strong>.`,
                details: 'Purchase details:',
                txn: 'Transaction ID:',
                serial: 'Serial Number:',
                footer: 'Please keep this email for your records.'
            }
        };

        const t = texts[lang] || texts.es;

        return baseLayout(`
            <h2>${t.title}</h2>
            <p>${t.greeting}</p>
            <p>${t.msg}</p>
            <div class="details">
                <strong>${t.details}</strong><br><br>
                ${t.txn} ${txnId}<br>
                ${serial ? `<strong>${t.serial}</strong> ${serial}` : ''}
            </div>
            <p>${t.footer}</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Ver mi Cuenta</a>
        `, t.title);
    },

    /**
     * Enlace de Activación (Magic Link)
     */
    magicLink: (name, link) => baseLayout(`
        <h2>Activa tu Licencia</h2>
        <p>Hola ${name || 'Usuario'},</p>
        <p>Gracias por tu compra en Rotator Survey. Para activar tu cuenta y licencia, haz clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" class="button">Activar Cuenta Ahora</a>
        </div>
        <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #777; font-size: 13px;">${link}</p>
        <p>Este enlace expirará en 24 horas.</p>
    `, 'Activa tu Licencia Rotator')
};

export default templates;
