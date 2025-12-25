/**
 * JWT Authentication Middleware
 * Protects API routes requiring authentication
 */

import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { createLogger } from '../../logging/index.js';
import { prisma } from '../../database/index.js';

const logger = createLogger('api:auth-middleware');

/**
 * Authenticated request with user context
 */
export interface AuthenticatedRequest {
    userId: string;
    sessionId: string;
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthenticatedRequest;
        }
    }
}

/**
 * JWT authentication middleware
 * Verifies Bearer token and attaches user context to request
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, config.jwt.secret) as {
            userId: string;
            sessionId: string;
        };

        // Validate session exists and is not expired
        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (!session) {
            res.status(401).json({ error: 'Session not found' });
            return;
        }

        if (session.expiresAt < new Date()) {
            // Clean up expired session
            await prisma.session.delete({ where: { id: payload.sessionId } });
            res.status(401).json({ error: 'Session expired' });
            return;
        }

        // Attach auth context to request
        req.auth = {
            userId: payload.userId,
            sessionId: payload.sessionId,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        logger.error({ error }, 'Authentication error');
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Optional authentication middleware
 * Attaches user context if valid token present, but doesn't require it
 */
export const optionalAuth: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        // No auth header, continue without authentication
        next();
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, config.jwt.secret) as {
            userId: string;
            sessionId: string;
        };

        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (session && session.expiresAt >= new Date()) {
            req.auth = {
                userId: payload.userId,
                sessionId: payload.sessionId,
            };
        }
    } catch {
        // Ignore auth errors for optional auth
    }

    next();
};
