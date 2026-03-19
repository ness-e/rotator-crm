/**
 * @file errorHandler.js
 * @description Centralized error handling middleware
 * 
 * @overview
 * Provides centralized error handling for all API routes with consistent
 * error responses, logging, and user-friendly messages.
 */

import logger from '../config/logger.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Error codes for different error types
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST'
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });

    // Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation error',
            code: ERROR_CODES.VALIDATION_ERROR,
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === 'P2002') {
            return res.status(409).json({
                error: 'Duplicate entry',
                code: ERROR_CODES.DUPLICATE_ENTRY,
                details: {
                    field: err.meta?.target
                }
            });
        }

        // Record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: 'Record not found',
                code: ERROR_CODES.NOT_FOUND
            });
        }

        // Foreign key constraint violation
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: 'Invalid reference',
                code: ERROR_CODES.BAD_REQUEST,
                details: {
                    field: err.meta?.field_name
                }
            });
        }

        // Generic database error
        return res.status(500).json({
            error: 'Database error',
            code: ERROR_CODES.DATABASE_ERROR
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: ERROR_CODES.AUTHENTICATION_ERROR
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            code: ERROR_CODES.AUTHENTICATION_ERROR
        });
    }

    // Custom AppError
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            details: err.details
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        error: message,
        code: ERROR_CODES.INTERNAL_ERROR,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: `Route ${req.originalUrl} not found`,
        code: ERROR_CODES.NOT_FOUND
    });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
