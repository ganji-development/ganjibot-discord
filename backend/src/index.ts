/**
 * Ganjibot-Discord
 * A modular, multipurpose Discord bot platform with an addon architecture.
 *
 * @license Apache-2.0
 * @copyright 2024 Ganji Development
 */

// Load environment variables FIRST
import 'dotenv/config';

import { config } from './config/index.js';
import { createLogger } from './logging/index.js';
import { createClient } from './bot/index.js';
import { createApiServer } from './api/index.js';
import { prisma, initializeDatabase } from './database/index.js';
import { AddonManager } from './addons/index.js';

const logger = createLogger('main');

async function main(): Promise<void> {
    logger.info('Starting Ganjibot-Discord...');
    logger.info(`Environment: ${config.env}`);

    try {
        // Initialize database with automatic schema sync
        // This ensures all tables and columns match the Prisma schema
        await initializeDatabase();

        // Initialize addon manager
        const addonManager = new AddonManager();
        await addonManager.initialize();
        logger.info('Addon manager initialized');

        // Create and start Discord client
        const client = createClient(addonManager);
        await client.login(config.discord.token);
        logger.info('Discord client connected');

        // Start API server
        const apiServer = await createApiServer(client, addonManager, config.api.port);

        // Graceful shutdown
        const shutdown = async (signal: string): Promise<void> => {
            logger.info(`Received ${signal}, shutting down...`);

            // Close API server
            apiServer.close();

            // Disconnect Discord client
            client.destroy();

            // Close database connection
            await prisma.$disconnect();

            logger.info('Shutdown complete');
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('FATAL ERROR:', error);
        logger.fatal({ error }, 'Failed to start Ganjibot-Discord');
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
