/**
 * @file index.js
 * @description Archivo del sistema index.js.
 * @module Module
 * @path /backend/src/index.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import usersRouter from './routes/users.js';
import licensesRouter from './routes/licenses.js';
import activationsRouter from './routes/activations.js';
import pendingLicensesRouter from './routes/invitations.js';
import catalogRouter from './routes/catalog.js';
import auditRouter from './routes/audit.js';
import rolesRouter from './routes/roles.js';
import settingsRouter from './routes/settings.js';
import notificationsRouter from './routes/notifications.js';
import backupRouter from './routes/backup.js';
import prospectsRouter from './routes/prospects.js';
import clientsRouter from './routes/clients.js';
import paypalRouter from './routes/paypal.js';
// CRM Routes
import crmRouter from './routes/crm.js';
import serversRouter from './routes/servers.js';
import domainsRouter from './routes/domains.js';
import migrationClientsRouter from './routes/migration-clients.js';
import followupsRouter from './routes/followups.js';
import templatesRouter from './routes/templates.js';
import validateRouter from './routes/validate.js';
import hostingPlansRouter from './routes/hosting-plans.js';
import locationsRouter from './routes/locations.js';
import providersRouter from './routes/providers.js';
import logger from './config/logger.js';
import { helmetConfig, apiRateLimiter, authRateLimiter, validateOrigin } from './middleware/security.js';
import { cacheMiddleware } from './middleware/cache.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';
import { initRoles } from './services/roles.service.js';
import { initSettings } from './services/settings.service.js';
import { initJobs } from './services/jobs.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
console.log('Force restart - Timestamp: ' + new Date().toISOString());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para PayPal IPN

// Logging de requests
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Seguridad: Helmet con configuración mejorada
app.use(helmetConfig);

// Validación de origen (CSRF básico)
if (process.env.NODE_ENV === 'production') {
  app.use(validateOrigin);
}

// CORS configuration supporting multiple origins
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5180').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (origins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Switched to true if required for cookies/sessions later
}))

app.get('/health', (req, res) => res.json({ ok: true }));

// Documentación API (Swagger)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Rotator Survey API Documentation'
  }));
  logger.info('Swagger UI available at /api-docs');
}

// Rate limiting general para API
app.use('/api', apiRateLimiter);

// Rutas con rate limiting y caché donde corresponda
// Rutas con rate limiting y caché
const apiRouter = express.Router();

if (process.env.NODE_ENV === 'production') {
  apiRouter.use('/auth', authRateLimiter, authRouter);
} else {
  apiRouter.use('/auth', authRouter);
}

apiRouter.use('/me', meRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/licenses', licensesRouter);
apiRouter.use('/activations', activationsRouter);
apiRouter.use('/invitations', pendingLicensesRouter);
apiRouter.use('/catalog', cacheMiddleware(300), catalogRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/backup', backupRouter);
apiRouter.use('/prospects', prospectsRouter);
apiRouter.use('/clients', clientsRouter);
apiRouter.use('/paypal', paypalRouter);
apiRouter.use('/crm', crmRouter);
apiRouter.use('/servers', serversRouter);
apiRouter.use('/domains', domainsRouter);
apiRouter.use('/migration-clients', migrationClientsRouter);
apiRouter.use('/followups', followupsRouter);
apiRouter.use('/templates', templatesRouter);
apiRouter.use('/hosting-plans', hostingPlansRouter);
apiRouter.use('/validate', validateRouter);
apiRouter.use('/locations', locationsRouter);
apiRouter.use('/providers', providersRouter);

app.use('/api', apiRouter);

// Servir archivos subidos (avatars, etc)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir frontend en producción o proxy en desarrollo
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const frontendPath = path.join(__dirname, '../dist');
  app.use(express.static(frontendPath));
  // SPA fallback: todas las rutas no-API sirven index.html
  app.get('*', (req, res) => {
    // No servir index.html para rutas API
    if (req.path.startsWith('/auth') || req.path.startsWith('/me') ||
      req.path.startsWith('/users') || req.path.startsWith('/licenses') ||
      req.path.startsWith('/activations') || req.path.startsWith('/invitations') ||
      req.path.startsWith('/catalog') || req.path.startsWith('/notifications') ||
      req.path.startsWith('/api-docs') || req.path.startsWith('/health')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // En desarrollo: intentar proxy a Vite (5173) para unificar backend+frontend
  try {
    // import dinámico para no requerir dependencia en producción
    const { createProxyMiddleware } = await import('http-proxy-middleware');
    const VITE_TARGET = process.env.VITE_DEV_SERVER || 'http://localhost:5180';
    const apiPrefixes = ['/auth', '/me', '/users', '/licenses', '/activations', '/invitations', '/catalog', '/notifications', '/api-docs', '/health', '/api/validate'];
    app.use('*', (req, res, next) => {
      if (apiPrefixes.some(p => req.path.startsWith(p))) return next();
      return createProxyMiddleware({
        target: VITE_TARGET,
        changeOrigin: true,
        ws: true,
      })(req, res, next);
    });
    console.log(`✅ Dev proxy enabled to ${VITE_TARGET}`);
  } catch (e) {
    console.warn('ℹ️ Dev proxy not enabled (http-proxy-middleware not installed). Frontend should run at http://localhost:5173');
  }
}

// Manejo global de errores no capturados con logger
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  // No cerrar el proceso, solo loguear
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  // No cerrar el proceso, solo loguear
});

// Middleware de manejo de errores centralizado
app.use((err, req, res, next) => {
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists'
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested record was not found'
    });
  }
  if (err.code === 'P1001' || err.code === 'P1000') {
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to the database'
    });
  }

  // Errores de validación (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: err.message || 'Invalid or expired token'
    });
  }

  // Error genérico
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      code: err.code,
      name: err.name
    })
  });
});

// Verificar conexión a BD al iniciar (después de definir rutas)
async function testConnection() {
  try {
    const { prisma } = await import('./config/prismaClient.js');
    // Intentar una query simple para verificar la conexión
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ SQLite database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'P1001') {
      console.error('💡 Error de conexión: El archivo de base de datos no puede ser abierto');
      console.error('💡 Verifica que:');
      console.error('   - El archivo rotator.db exista en prisma/');
      console.error('   - No haya otro proceso usando el archivo');
      console.error('   - Tengas permisos de lectura/escritura en el archivo');
    } else {
      console.error('💡 Verifica que el archivo rotator.db exista en prisma/');
      console.error('💡 O configura DATABASE_URL');
    }
  }
}

// 404 handler - must be after all routes
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
app.use(notFoundHandler);

// Error handler - must be last middleware
app.use(errorHandler);

// Inicializar roles, settings y jobs
await initRoles();
await initSettings();
await initJobs();

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Allowed origins: ${origins.join(', ')}`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    logger.info(`Swagger docs: http://localhost:${PORT}/api-docs`);
  }
});
