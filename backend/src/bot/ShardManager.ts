/**
 * Shard Manager
 * Handles spawning and managing bot shards for horizontal scaling
 */

import { ShardingManager } from 'discord.js';
import path from 'path';
import { config } from '../config/index.js';
import { createLogger } from '../logging/index.js';

const logger = createLogger('sharding');

export class BotShardManager {
    private manager: ShardingManager;

    constructor() {
        // Point to the entry file based on environment
        // In development, we need to handle TS execution if running via ts-node/tsx
        const isDev = config.env === 'development';

        const scriptPath = isDev
            ? path.join(process.cwd(), 'src', 'index.ts')
            : path.join(process.cwd(), 'dist', 'index.js');

        this.manager = new ShardingManager(scriptPath, {
            token: config.discord.token,
            totalShards: 'auto',
            // Pass exec args to support TS execution in dev if needed
            // However, usually we run the shard manager itself with tsx
            // and it spawns child processes.
            // If running via `tsx src/sharding.ts`, child processes need the loader too.
            execArgv: isDev ? ['--import', 'tsx'] : [],
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.manager.on('shardCreate', (shard) => {
            logger.info({ id: shard.id }, 'Launched shard');

            shard.on('death', () => logger.error({ id: shard.id }, 'Shard died'));
            shard.on('ready', () => logger.info({ id: shard.id }, 'Shard ready'));
            shard.on('disconnect', () => logger.warn({ id: shard.id }, 'Shard disconnected'));
            shard.on('reconnecting', () => logger.info({ id: shard.id }, 'Shard reconnecting'));
        });
    }

    public async spawn() {
        try {
            logger.info('Spawning shards...');
            await this.manager.spawn();
            logger.info('All shards spawned successfully');
        } catch (error) {
            logger.fatal({ error }, 'Failed to spawn shards');
            process.exit(1);
        }
    }
}
