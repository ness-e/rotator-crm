import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendEmail } = await import('../src/services/email.service.js');

async function run() {
    console.log('Testing email delivery via email.service.js...');
    console.log('Using SMTP Host:', process.env.SMTP_HOST || 'NONE (Mock Mode)');

    const success = await sendEmail(
        'eros.messy@gmail.com',
        'Prueba de envío de rotatorsurvey',
        '<h2>¡Hola!</h2><p>Este es un correo de prueba generado por el sistema automatizado.</p>'
    );

    if (success) {
        console.log('Result: Success - Function returned true.');
    } else {
        console.log('Result: Failed - Function returned false.');
    }
    process.exit(0);
}

run();
