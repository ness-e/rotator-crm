/**
 * @file swagger.js
 * @description Swagger/OpenAPI documentation configuration
 * 
 * @overview
 * Configures Swagger UI and OpenAPI specification for API documentation.
 * Provides interactive API documentation at /api-docs endpoint.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Rotator Survey API',
            version: '1.0.0',
            description: 'API documentation for Rotator Survey License Management System',
            contact: {
                name: 'Rotator Survey',
                email: 'support@rotatorsurvey.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server'
            },
            {
                url: 'https://api.rotatorsurvey.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Authorization header using the Bearer scheme'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object'
                            },
                            description: 'Detailed error information (validation errors)'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        correo_cliente: { type: 'string', format: 'email' },
                        nombre_cliente: { type: 'string' },
                        apellido_cliente: { type: 'string' },
                        pais_cliente: { type: 'string' },
                        ciudad_cliente: { type: 'string' },
                        organizacion_cliente: { type: 'string' },
                        role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'] },
                        fecha_registro: { type: 'string', format: 'date-time' }
                    }
                },
                License: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        licencia_serial: { type: 'string' },
                        licencia_tipo: { type: 'string' },
                        licencia_expira: { type: 'string', format: 'date' },
                        licencia_activa: { type: 'boolean' },
                        id_cliente: { type: 'integer' }
                    }
                },
                Organization: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string', format: 'email' },
                        nombre: { type: 'string' },
                        isMaster: { type: 'boolean' },
                        isActive: { type: 'boolean' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js'] // Path to route files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
