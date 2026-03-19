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

// Iniciar backend
console.log('[1/2] Iniciando Backend en puerto 3005...');
const backend = spawn('npm', ['-w', 'backend', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Esperar un poco antes de iniciar frontend
setTimeout(() => {
  console.log('[2/2] Iniciando Frontend en puerto 5180...');
  const frontend = spawn('npm', ['-w', 'frontend', 'run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (err) => {
    console.error('Error iniciando frontend:', err);
  });
}, 2000);

backend.on('error', (err) => {
  console.error('Error iniciando backend:', err);
});

console.log('');
console.log('========================================');
console.log('  Servidores iniciados!');
console.log('========================================');
console.log('');
console.log('Backend:  http://localhost:3005');
console.log('Frontend: http://localhost:5180');
console.log('');
console.log('Presiona Ctrl+C para detener ambos servidores');

