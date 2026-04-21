import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seed() {
    const templates = [
        {
            code: 'USER_WELCOME',
            name: 'Bienvenida a Nuevo Usuario',
            subject: '¡Bienvenido a Rotator Survey!',
            body: `
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>Hola {{name}}</h1>
        </div>
        <div style="padding: 20px;">
            <p>Gracias por unirte a nuestra plataforma. Tu cuenta ha sido creada exitosamente.</p>
            <p><strong>Tu usuario:</strong> {{email}}</p>
            <p>Puedes acceder al sistema haciendo clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{login_url}}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            &copy; {{year}} Rotator Survey. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
            `.trim(),
            variables: JSON.stringify(['name', 'email', 'login_url', 'year'])
        },
        {
            code: 'PASSWORD_RESET',
            name: 'Restablecer Contraseña',
            subject: 'Instrucciones para cambiar tu contraseña',
            body: `
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2>Solicitud de cambio de contraseña</h2>
        <p>Hola {{name}},</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no hiciste esta solicitud, puedes ignorar este correo.</p>
        <p>Para elegir una nueva contraseña, haz clic en el enlace de abajo:</p>
        <p><a href="{{reset_url}}">{{reset_url}}</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Rotator Survey System Alert</p>
    </div>
</body>
</html>
            `.trim(),
            variables: JSON.stringify(['name', 'reset_url'])
        },
        {
            code: 'LICENSE_EXPIRY_ALERT',
            name: 'Alerta de Vencimiento de Licencia',
            subject: 'IMPORTANTE: Tu licencia está por vencer',
            body: `
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 2px solid #ffc107; padding: 20px; border-radius: 8px;">
        <h2 style="color: #856404;">Aviso de Vencimiento</h2>
        <p>Estimado/a {{client_name}},</p>
        <p>Te informamos que tu licencia <strong>{{license_code}}</strong> vencerá el próximo <strong>{{expiry_date}}</strong>.</p>
        <p>Para evitar interrupciones en tu servicio, te recomendamos renovar a la brevedad.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Días restantes:</strong> {{days_left}}
        </div>
        <p>Contacta a tu asesor comercial para más detalles.</p>
    </div>
</body>
</html>
            `.trim(),
            variables: JSON.stringify(['client_name', 'license_code', 'expiry_date', 'days_left'])
        }
    ]

    for (const t of templates) {
        await prisma.emailTemplate.upsert({
            where: { code: t.code },
            update: t,
            create: t
        })
    }
    console.log('Seeded templates successfully')
}

seed()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
