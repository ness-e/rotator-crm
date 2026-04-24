import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('========================================');
console.log('  Iniciando Sistema de Usuarios');
console.log('========================================');
console.log('');
console.log('Base de datos: SQLite (backend/prisma/rotator.db)');
console.log('');

// Iniciar Sistema Unificado
console.log('[1/1] Iniciando Sistema Unificado...');
const unified = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'sistemaUnificado'),
  stdio: 'inherit',
  shell: true
});

unified.on('error', (err) => {
  console.error('Error iniciando sistema unificado:', err);
});

console.log('');
console.log('========================================');
console.log('  Sistema Unificado Iniciado!');
console.log('========================================');
console.log('');
console.log('Frontend: http://localhost:5180');
console.log('Backend:  http://localhost:3005');
console.log('');
console.log('Presiona Ctrl+C para detener ambos servidores');

