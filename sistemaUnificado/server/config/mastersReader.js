/**
 * @file mastersReader.js
 * @description Legacy PHP configuration file reader (deprecated)
 * 
 * @overview
 * This module reads database credentials from a legacy PHP configuration file
 * (masters.php). Used for backward compatibility with old Rotator Survey system.
 * Falls back to environment variables if PHP file not found.
 * 
 * @deprecation-note
 * ⚠️ **This module is deprecated and should not be used in new code.**
 * The system now uses SQLite (prismaClient.js) instead of MySQL.
 * This file exists only for legacy compatibility during migration.
 * 
 * @features
 * - Reads PHP configuration file (masters.php)
 * - Parses PHP $GLOBALS array syntax
 * - Fallback to environment variables
 * - Returns database credentials object
 * 
 * @usage
 * ```javascript
 * import { readMasters } from './config/mastersReader.js';
 * 
 * // Read credentials
 * const { host, user, pass, db } = readMasters();
 * 
 * // Use with MySQL connection (legacy)
 * const connection = mysql.createConnection({ host, user, password: pass, database: db });
 * ```
 * 
 * @php-file-format
 * Expected masters.php format:
 * ```php
 * <?php
 * $GLOBALS['master_host'] = 'localhost';
 * $GLOBALS['master_user'] = 'root';
 * $GLOBALS['master_pass'] = 'password';
 * $GLOBALS['master_db'] = 'rotator_db';
 * ?>
 * ```
 * 
 * @file-location
 * Default: `rotator_masters_lics/masters.php` (relative to project root)
 * Override: Set MASTERS_PATH environment variable
 * 
 * @fallback-behavior
 * If masters.php not found, reads from environment variables:
 * - DB_HOST
 * - DB_USER
 * - DB_PASS
 * - DB_NAME
 * 
 * @return-value
 * ```javascript
 * {
 *   host: string,  // Database host
 *   user: string,  // Database user
 *   pass: string,  // Database password
 *   db: string     // Database name
 * }
 * ```
 * 
 * @environment-variables
 * - MASTERS_PATH: Path to masters.php file
 * - DB_HOST: Fallback database host
 * - DB_USER: Fallback database user
 * - DB_PASS: Fallback database password
 * - DB_NAME: Fallback database name
 * 
 * @migration-notes
 * This module should be removed after complete migration to SQLite.
 * Current system uses Prisma + SQLite (see prismaClient.js).
 * 
 * @dependencies
 * - fs - File system operations
 * - path - Path manipulation
 * 
 * @related-files
 * - rotator_masters_lics/masters.php - Legacy PHP config (if exists)
 * - backend/src/config/prismaClient.js - Current database config
 * 
 * @module mastersReader.config
 * @path /backend/src/config/mastersReader.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function readMasters() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Resolve from project root by default, allow override via env MASTERS_PATH
  const defaultPath = path.resolve(__dirname, '../../../rotator_masters_lics/masters.php');
  const mastersPath = process.env.MASTERS_PATH || defaultPath;
  if (!fs.existsSync(mastersPath)) {
    // Fallback to environment variables in local/dev
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const pass = process.env.DB_PASS;
    const db = process.env.DB_NAME;
    if (host && user && pass && db) {
      return { host, user, pass, db };
    }
    throw new Error(`masters.php not found. Set MASTERS_PATH env or place it at: ${defaultPath}`);
  }
  const php = fs.readFileSync(mastersPath, 'utf-8');
  const get = (key) => {
    const re = new RegExp("\\$GLOBALS\\\\['" + key + "'\\\\]\\s*=\\s*['\"]([^'\"]+)['\"];", 'm');
    const m = php.match(re);
    return m ? m[1] : '';
  };
  return {
    host: get('master_host'),
    user: get('master_user'),
    pass: get('master_pass'),
    db: get('master_db'),
  };
}
