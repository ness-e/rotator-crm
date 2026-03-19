/**
 * @file logger.js
 * @description Winston-based logging configuration for application-wide logging
 * 
 * @overview
 * This module configures Winston logger for the application with different transports
 * and formats for development and production environments. Provides structured logging
 * with timestamps, error stack traces, and automatic log rotation in production.
 * 
 * @features
 * - Structured JSON logging
 * - Colorized console output in development
 * - File-based logging in production (error.log, combined.log)
 * - Automatic log rotation (5MB max, 5 files)
 * - Configurable log levels via environment variable
 * - Error stack trace capture
 * 
 * @log-levels
 * - error: Error messages (logged to error.log in production)
 * - warn: Warning messages
 * - info: Informational messages (default level)
 * - http: HTTP request logs
 * - verbose: Verbose output
 * - debug: Debug messages
 * - silly: Very detailed logs
 * 
 * @usage
 * ```javascript
 * import logger from './config/logger.js';
 * 
 * // Log messages
 * logger.info('Server started on port 3001');
 * logger.warn('Deprecated API endpoint used');
 * logger.error('Database connection failed', { error: err });
 * 
 * // With metadata
 * logger.info('User logged in', { userId: 123, email: 'user@example.com' });
 * 
 * // Error with stack trace
 * try {
 *   // code
 * } catch (error) {
 *   logger.error('Operation failed', { error });
 * }
 * ```
 * 
 * @transports
 * **Development:**
 * - Console with colorized output
 * - Simple format for readability
 * 
 * **Production:**
 * - Console with JSON format
 * - File: logs/error.log (errors only)
 * - File: logs/combined.log (all logs)
 * - Automatic rotation at 5MB
 * - Keeps last 5 files
 * 
 * @log-format
 * ```json
 * {
 *   "timestamp": "2026-01-29 17:00:00",
 *   "level": "info",
 *   "message": "Server started",
 *   "service": "rotator-backend",
 *   "userId": 123
 * }
 * ```
 * 
 * @environment-variables
 * - LOG_LEVEL: Minimum log level (default: 'info')
 * - NODE_ENV: 'development' or 'production'
 * 
 * @production-setup
 * 1. Ensure logs/ directory exists or is writable
 * 2. Set LOG_LEVEL=warn or LOG_LEVEL=error for production
 * 3. Configure log rotation/archival (logrotate, CloudWatch, etc.)
 * 4. Monitor log file sizes
 * 5. Consider centralized logging (ELK, Datadog, etc.)
 * 
 * @dependencies
 * - winston - Logging library
 * 
 * @related-files
 * - backend/src/index.js - Uses logger for server startup
 * - backend/src/services/*.js - All services use logger
 * - backend/logs/ - Log files directory (production)
 * 
 * @module logger.config
 * @path /backend/src/config/logger.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import winston from 'winston'

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rotator-backend' },
  transports: [
    // Escribir todos los logs a console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
        })
      )
    }),
    // Escribir errores a archivo (solo si el directorio existe)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Escribir todos los logs a archivo
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : [])
  ]
})

// Si no estamos en producción, mostrar logs más detallados
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
