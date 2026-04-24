/**
 * @file prismaClient.js
 * @description Prisma Client configuration and SQLite database connection setup
 * 
 * @overview
 * This module configures and exports a singleton Prisma Client instance for database
 * access. Handles SQLite database path resolution (relative/absolute), ensures database
 * directory exists, and provides connection diagnostics on startup.
 * 
 * @features
 * - Singleton Prisma Client instance
 * - Automatic database directory creation
 * - Relative/absolute path resolution
 * - Database file existence checking
 * - Permission verification
 * - Connection diagnostics logging
 * - Development/production logging modes
 * 
 * @database-location
 * Default: `prisma/rotator.db`
 * 
 * Path resolution priority:
 * 1. DATABASE_URL environment variable
 * 2. Relative paths converted to absolute
 * 3. Default: prisma/rotator.db
 * 
 * @usage
 * ```javascript
 * import { prisma } from './config/prismaClient.js';
 * 
 * // Query users
 * const users = await prisma.user.findMany();
 * 
 * // Create license
 * const license = await prisma.license.create({
 *   data: { serialKey: 'ABC-123', status: 'ACTIVE' }
 * });
 * 
 * // Transaction
 * await prisma.$transaction([
 *   prisma.user.create({ data: userData }),
 *   prisma.license.create({ data: licenseData })
 * ]);
 * ```
 * 
 * @path-resolution
 * Handles multiple DATABASE_URL formats:
 * - `file:./rotator.db` → Converts to absolute path
 * - `file:../prisma/rotator.db` → Converts to absolute path
 * - `file:/absolute/path/rotator.db` → Uses as-is
 * - Not set → Uses default prisma/rotator.db
 * 
 * @startup-diagnostics
 * On initialization, logs:
 * - Database file path
 * - DATABASE_URL being used
 * - File existence status
 * - File size (if exists)
 * - Permission warnings (if applicable)
 * 
 * @logging-modes
 * **Development:**
 * - Logs: error, warn
 * - More verbose for debugging
 * 
 * **Production:**
 * - Logs: error only
 * - Minimal logging for performance
 * 
 * @environment-variables
 * - DATABASE_URL: SQLite database path (default: file:prisma/rotator.db)
 * - NODE_ENV: 'development' or 'production'
 * 
 * @error-handling
 * - Throws error if Prisma Client initialization fails
 * - Warns if database file not found (Prisma will create)
 * - Warns if permission issues detected
 * 
 * @production-notes
 * - Ensure database directory has write permissions
 * - Consider database backups (use backup.service.js)
 * - Monitor database file size
 * - Use absolute paths in production
 * - Consider read replicas for scaling
 * 
 * @dependencies
 * - @prisma/client - Prisma ORM client
 * - fs - File system operations
 * - path - Path manipulation
 * 
 * @related-files
 * - prisma/schema.prisma - Database schema
 * - prisma/rotator.db - SQLite database file
 * - backend/src/services/*.js - All services use prisma
 * - backend/src/routes/*.js - All routes use prisma
 * 
 * @module prismaClient.config
 * @path /server/config/prismaClient.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite: usar archivo local rotator.db
// Resolver ruta absoluta desde server/config/
const defaultDbPath = path.resolve(__dirname, '../../prisma/rotator.db');
// Asegurar que el directorio existe
const dbDir = path.dirname(defaultDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Convertir ruta relativa a absoluta si es necesario
let dbPath = process.env.DATABASE_URL;
if (dbPath) {
  // Si DATABASE_URL es relativa (empieza con file:./), convertir a absoluta
  if (dbPath.startsWith('file:./') || dbPath.startsWith('file:../')) {
    // Extraer la ruta relativa
    const relativePath = dbPath.replace(/^file:/, '');
    // Resolver a absoluta desde el directorio del schema (backend/prisma/)
    const absolutePath = path.resolve(__dirname, '../../prisma', relativePath);
    // Normalizar para Prisma (forward slashes)
    dbPath = `file:${absolutePath.replace(/\\/g, '/')}`;
    // Actualizar DATABASE_URL para que Prisma la use
    process.env.DATABASE_URL = dbPath;
  }
} else {
  // Si no hay DATABASE_URL, usar ruta absoluta por defecto
  const normalizedPath = defaultDbPath.replace(/\\/g, '/');
  dbPath = `file:${normalizedPath}`;
  process.env.DATABASE_URL = dbPath;
}

let prisma;
try {
  if (process.env.NODE_ENV !== 'test') {
    const displayPath = defaultDbPath.replace(/\\/g, '/');
    console.log(`📊 Connecting to SQLite database: ${displayPath}`);
    console.log(`📊 Using DATABASE_URL: ${dbPath}`);
  }

  // Verificar que el archivo existe o puede ser creado
    if (fs.existsSync(defaultDbPath)) {
      const stats = fs.statSync(defaultDbPath);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`✅ Database file found (${(stats.size / 1024).toFixed(2)} KB)`);
      }

      // Verificar permisos de lectura/escritura
      try {
        fs.accessSync(defaultDbPath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (permError) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`⚠️  Warning: Possible permission issue with database file`);
        }
      }
    } else if (process.env.NODE_ENV !== 'test') {
      const displayPath = defaultDbPath.replace(/\\/g, '/');
      console.warn(`⚠️  Database file not found at: ${displayPath}`);
      console.warn(`💡 Prisma will create it on first use`);
    }

  // Crear Prisma Client - Prisma leerá DATABASE_URL del process.env
  let prismaLog = ['error']
  if (process.env.NODE_ENV === 'test') {
    prismaLog = [] // Completamente silencioso en tests
  } else if (process.env.NODE_ENV === 'development') {
    prismaLog = ['error', 'warn']
  }

  prisma = new PrismaClient({
    log: prismaLog
  });

} catch (error) {
  console.error('❌ Error initializing Prisma Client:', error.message);
  throw error;
}

export { prisma };
