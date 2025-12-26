/**
 * Database module
 * Provides Prisma client instance and auto-sync functionality
 * Updated for Prisma 7 with driver adapter pattern
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../logging/index.js';

const execAsync = promisify(exec);
const logger = createLogger('database');

// Create MariaDB adapter for Prisma 7
const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
    user: process.env.DATABASE_USER ?? 'ganjibot',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'ganjibot',
    connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT ?? '10', 10),
});

// Create Prisma client with adapter (Prisma 7 pattern)
export const prisma = new PrismaClient({ adapter });

/**
 * Synchronize database schema with Prisma schema
 * Uses `prisma db push` which:
 * - Creates missing tables
 * - Adds missing columns
 * - Modifies column types if changed
 * - Checks every column in every table
 *
 * This is thorough and ensures the database matches the schema exactly.
 */
export async function syncDatabaseSchema(): Promise<void> {
    logger.info('Synchronizing database schema...');

    try {
        // Run prisma db push to sync schema
        // --accept-data-loss is NOT used - will fail if destructive changes are needed
        // This ensures data safety while still syncing additive changes
        const { stdout, stderr } = await execAsync('npx prisma db push', {
            env: { ...process.env },
            cwd: process.cwd(),
        });

        if (stdout) {
            // Parse output to log meaningful information
            const lines = stdout.split('\n').filter((line: string) => line.trim());
            for (const line of lines) {
                if (line.includes('Your database is now in sync')) {
                    logger.info('Database schema is in sync');
                } else if (line.includes('changes')) {
                    logger.info({ details: line.trim() }, 'Schema changes applied');
                }
            }
        }

        if (stderr && !stderr.includes('warn')) {
            logger.warn({ stderr }, 'Database sync warnings');
        }

        logger.info('Database schema synchronization complete');
    } catch (error) {
        const err = error as { message?: string; stderr?: string };

        // Check if this is a destructive change that requires manual intervention
        if (err.stderr?.includes('data loss') || err.message?.includes('data loss')) {
            logger.error(
                {
                    error: err.message,
                    hint: 'Run `npx prisma db push --accept-data-loss` manually if you understand the implications',
                },
                'Database sync requires destructive changes - manual intervention needed'
            );
        } else {
            logger.error({ error: err.message }, 'Failed to synchronize database schema');
        }

        throw error;
    }
}

/**
 * Validate database connection and schema
 * Runs a simple query to ensure connectivity and schema validity
 */
export async function validateDatabase(): Promise<void> {
    logger.debug('Validating database connection and schema...');

    try {
        // Test basic connectivity
        await prisma.$queryRaw`SELECT 1`;
        logger.debug('Database connection validated');

        // Validate core tables exist by attempting to count records
        // This will throw if tables don't exist or schema is wrong
        await Promise.all([
            prisma.guild.count(),
            prisma.addon.count(),
            prisma.guildAddon.count(),
            prisma.logConfig.count(),
            prisma.auditLog.count(),
            prisma.session.count(),
            prisma.secret.count(),
        ]);

        logger.debug('All database tables validated');
    } catch (error) {
        logger.error({ error }, 'Database validation failed');
        throw error;
    }
}

/**
 * Initialize database with schema sync and validation
 * Call this at application startup before any database operations
 */
export async function initializeDatabase(): Promise<void> {
    // First, sync the schema to ensure all tables/columns exist
    await syncDatabaseSchema();

    // Connect to the database
    await prisma.$connect();
    logger.info('Database connected');

    // Validate the schema
    await validateDatabase();
}
