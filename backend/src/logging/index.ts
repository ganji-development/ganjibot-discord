/**
 * Logging module
 * Provides structured logging with Pino
 */

import pino, { type Logger } from 'pino';
import { config } from '../config/index.js';

// Base logger configuration
const baseLogger = pino({
    level: config.logging.level,
    ...(config.logging.pretty && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
    }),
});

/**
 * Create a child logger with a specific name (component/module)
 */
export function createLogger(name: string): Logger {
    return baseLogger.child({ name });
}

/**
 * Export the base logger for direct use
 */
export { baseLogger as logger };

export type { Logger };
