/**
 * Rate Limiting Middleware
 * Prevents API abuse with configurable limits
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createLogger } from '../../logging/index.js';

const logger = createLogger('api:rate-limit');

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitOptions {
    windowMs?: number; // Time window in milliseconds
    max?: number; // Max requests per window
    keyGenerator?: (req: Request) => string;
    message?: string;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
            store.delete(key);
        }
    }
}, 60000); // Clean every minute

/**
 * Get client IP from request
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() ?? 'unknown';
    }
    if (Array.isArray(forwarded) && forwarded.length > 0 && forwarded[0]) {
        return forwarded[0].trim();
    }
    return req.ip ?? 'unknown';
}

/**
 * Create a rate limiting middleware with configurable options
 */
export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes default
        max = 100, // 100 requests per window
        keyGenerator = (req: Request) => `rate:${getClientIp(req)}`,
        message = 'Too many requests, please try again later',
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator(req);
        const now = Date.now();

        let entry = store.get(key);

        if (!entry || entry.resetAt <= now) {
            // Create new entry or reset expired one
            entry = {
                count: 1,
                resetAt: now + windowMs,
            };
            store.set(key, entry);
        } else {
            entry.count++;
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        if (entry.count > max) {
            logger.warn({ key, count: entry.count }, 'Rate limit exceeded');

            res.status(429).json({
                error: 'Too Many Requests',
                message,
                retryAfter: Math.ceil((entry.resetAt - now) / 1000),
            });
            return;
        }

        next();
    };
}

/**
 * Standard rate limit for general API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimit: RequestHandler = rateLimit();

/**
 * Strict rate limit for sensitive endpoints (auth, etc.)
 * 20 requests per 15 minutes
 */
export const strictRateLimit: RequestHandler = rateLimit({
    max: 20,
    message: 'Too many authentication attempts, please try again later',
});

/**
 * Higher rate limit for authenticated users
 * 500 requests per 15 minutes
 */
export const authenticatedRateLimit: RequestHandler = rateLimit({
    max: 500,
    keyGenerator: (req: Request): string => {
        // Use user ID if authenticated, otherwise fall back to IP
        const auth = (req as Request & { auth?: { userId: string } }).auth;
        if (auth?.userId) {
            return `rate:user:${auth.userId}`;
        }
        return `rate:${getClientIp(req)}`;
    },
});
