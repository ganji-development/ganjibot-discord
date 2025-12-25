/**
 * Error Handler Middleware
 */

import type { ErrorRequestHandler } from 'express';
import { createLogger } from '../../logging/index.js';

const logger = createLogger('api:error');

/**
 * Express error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    logger.error(
        {
            error: err,
            path: req.path,
            method: req.method,
        },
        'API error'
    );

    // Handle known error types
    if (err.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation Error',
            message: err.message,
        });
        return;
    }

    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication',
        });
        return;
    }

    // Default to 500 Internal Server Error
    res.status(500).json({
        error: 'Internal Server Error',
        message:
            process.env.NODE_ENV === 'development'
                ? err.message
                : 'An unexpected error occurred',
    });
};
