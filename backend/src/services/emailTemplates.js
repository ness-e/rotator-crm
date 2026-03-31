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
    magicLink: (name, link) => {
        const title = 'SISTEMA DE USUARIOS ROTATOR SURVEY';
        const header = 'INVITACIÓN DE REGISTRO';
        const msg = 'Apreciable cliente,<br><br><b>¡Ha sido invitado para registrarse y activar su cuenta corporativa en Rotator Survey!</b><br><br>Para continuar con su registro de manera segura, haga clic en el link mostrado abajo.<br><br>';
        const boton = 'Clic para registrarse';
        const footer = 'Si por alguna razón no logra registrarse, por favor entre en contacto via SKYPE al id ROTATOR_COMERCIAL, o al correo dmedina@rotatorsurvey.com<br><br>¡Gracias y bienvenido en nombre del equipo de Rotator Survey!';

        return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0;">
<meta name="format-detection" content="telephone=no" />
<style>
/* Reset styles */
body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; background-color: #F8F9FA;}
body, table, td, div, p, a { -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }
img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
#outlook a { padding: 0; }
.ReadMsgBody { width: 100%; }
.ExternalClass { width: 100%; }
.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
@media all and (min-width: 560px) {
    .container { border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; -khtml-border-radius: 8px; }
}
a, a:hover { color: #FFFFFF; }
.footer a, .footer a:hover { color: #828999; }
</style>
<title>INVITACIÓN ROTATOR SURVEY</title>
</head>
<body topmargin="0" rightmargin="0" bottommargin="0" leftmargin="0" marginwidth="0" marginheight="0" width="100%" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%; height: 100%; -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; font-family: sans-serif; background-color: #F8F9FA;" text="#333333">
<br><br>
<table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%; background-color: #F8F9FA;" class="background">
    <tr>
        <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;"  >
        <table border="0" cellpadding="0" cellspacing="0" align="center" width="500" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit; max-width: 500px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" class="wrapper">
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;padding-top: 30px;" class="hero">
                    <a target="_blank" style="text-decoration: none;" href="https://rotatorsurvey.com">
                        <img border="0" vspace="0" hspace="0" src="https://rotatorsurvey.com/user/images/1.png" alt="Rotator Survey" title="Hero Image" width="250" style="width: 250px;max-width: 250px; font-size: 13px; margin: 0; padding: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: none; display: block;" />
                    </a>
                </td>
            </tr>
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 13px; font-weight: 400; line-height: 150%; letter-spacing: 2px;padding-top: 27px;padding-bottom: 0; font-family: sans-serif; color: #565F73;" class="supheader">${title}</td>
            </tr>
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;  padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 24px; font-weight: bold; line-height: 130%;padding-top: 5px; font-family: sans-serif; color: #111827;" class="header">${header}</td>
            </tr>
            <tr>
                <td align="left" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 16px; font-weight: 400; line-height: 160%;padding-top: 15px; font-family: sans-serif; color: #4B5563;" class="paragraph">            
                        ${msg}
                </td>
            </tr>
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;padding-top: 25px;padding-bottom: 25px;" class="button">
                    <a href="${link}" target="_blank" style="text-decoration: underline;">
                        <table border="0" cellpadding="0" cellspacing="0" align="center" style="max-width: 260px; min-width: 120px; border-collapse: collapse; border-spacing: 0; padding: 0;">
                            <tr>
                                <td align="center" valign="middle" style="padding: 14px 28px; margin: 0; text-decoration: underline; border-collapse: collapse; border-spacing: 0; border-radius: 6px; -webkit-border-radius: 6px; -moz-border-radius: 6px; -khtml-border-radius: 6px;" bgcolor="#E9703E">
                                    <a target="_blank" style="text-decoration: underline;color: #FFFFFF; font-family: sans-serif; font-size: 16px; font-weight: 600; line-height: 120%;" href="${link}">${boton}</a>
                                </td>
                            </tr>
                        </table>
                    </a>
                </td>
            </tr>
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;" class="line">
                        <hr color="#E5E7EB" align="center" width="100%" size="1" noshade style="margin: 0; padding: 0;" />
                    </td>
                </tr>
            <tr>
                    <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 13px; font-weight: 400; line-height: 150%;padding-top: 20px;padding-bottom: 30px;color: #828999;font-family: sans-serif;" class="footer">${footer}</td>
                </tr> 
        </table>
        <br><br>
        </td>
    </tr>
</table>
</body>
</html>`;
    }
};

export default templates;
