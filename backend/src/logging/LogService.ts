/**
 * LogService - Central orchestration for Discord event logging
 * Manages log configuration caching and routes events to loggers
 */

import { Client, EmbedBuilder, TextChannel, type ColorResolvable } from 'discord.js';
import { prisma } from '../database/index.js';
import { createLogger } from './index.js';

const logger = createLogger('log-service');

// LogType enum values matching Prisma schema
export type LogType =
    | 'MESSAGE_EDIT'
    | 'MESSAGE_DELETE'
    | 'MESSAGE_BULK_DELETE'
    | 'MEMBER_JOIN'
    | 'MEMBER_LEAVE'
    | 'MEMBER_UPDATE'
    | 'MEMBER_BAN'
    | 'MEMBER_UNBAN'
    | 'ROLE_CREATE'
    | 'ROLE_UPDATE'
    | 'ROLE_DELETE'
    | 'CHANNEL_CREATE'
    | 'CHANNEL_UPDATE'
    | 'CHANNEL_DELETE'
    | 'VOICE_STATE'
    | 'INVITE_CREATE'
    | 'INVITE_DELETE'
    | 'MODERATION';

interface CachedLogConfig {
    channelId: string;
    enabled: boolean;
    filters: Record<string, unknown>;
    format: Record<string, unknown>;
}

// Guild ID -> LogType -> Config
type ConfigCache = Map<string, Map<LogType, CachedLogConfig>>;

// Colors for different log types
export const LOG_COLORS: Record<LogType, ColorResolvable> = {
    MESSAGE_EDIT: 0xf1c40f,      // Yellow
    MESSAGE_DELETE: 0xe74c3c,   // Red
    MESSAGE_BULK_DELETE: 0xe74c3c,
    MEMBER_JOIN: 0x2ecc71,      // Green
    MEMBER_LEAVE: 0xe74c3c,     // Red
    MEMBER_UPDATE: 0x3498db,    // Blue
    MEMBER_BAN: 0xe74c3c,       // Red
    MEMBER_UNBAN: 0x2ecc71,     // Green
    ROLE_CREATE: 0x9b59b6,      // Purple
    ROLE_UPDATE: 0x9b59b6,
    ROLE_DELETE: 0x9b59b6,
    CHANNEL_CREATE: 0x3498db,   // Blue
    CHANNEL_UPDATE: 0x3498db,
    CHANNEL_DELETE: 0x3498db,
    VOICE_STATE: 0x1abc9c,      // Teal
    INVITE_CREATE: 0x95a5a6,    // Gray
    INVITE_DELETE: 0x95a5a6,
    MODERATION: 0xe67e22,       // Orange
};

/**
 * LogService - Central logging orchestrator
 */
export class LogService {
    private readonly client: Client;
    private readonly configCache: ConfigCache = new Map();
    private cacheRefreshInterval: NodeJS.Timeout | null = null;

    constructor(client: Client) {
        this.client = client;
    }

    /**
     * Initialize the log service
     * Loads config cache and starts refresh interval
     */
    public async initialize(): Promise<void> {
        await this.refreshCache();

        // Refresh cache every 5 minutes
        this.cacheRefreshInterval = setInterval(
            () => this.refreshCache(),
            5 * 60 * 1000
        );

        logger.info('LogService initialized');
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        if (this.cacheRefreshInterval) {
            clearInterval(this.cacheRefreshInterval);
            this.cacheRefreshInterval = null;
        }
    }

    /**
     * Refresh the configuration cache from database
     */
    public async refreshCache(): Promise<void> {
        try {
            const configs = await prisma.logConfig.findMany({
                where: { enabled: true },
            });

            this.configCache.clear();

            for (const config of configs) {
                if (!this.configCache.has(config.guildId)) {
                    this.configCache.set(config.guildId, new Map());
                }

                this.configCache.get(config.guildId)!.set(config.logType as LogType, {
                    channelId: config.channelId,
                    enabled: config.enabled,
                    filters: config.filters as Record<string, unknown>,
                    format: config.format as Record<string, unknown>,
                });
            }

            logger.debug({ guilds: this.configCache.size }, 'Log config cache refreshed');
        } catch (error) {
            logger.error({ error }, 'Failed to refresh log config cache');
        }
    }

    /**
     * Invalidate cache for a specific guild (call after config update)
     */
    public invalidateGuildCache(guildId: string): void {
        this.configCache.delete(guildId);
    }

    /**
     * Get log config for a guild and log type
     */
    public getConfig(guildId: string, logType: LogType): CachedLogConfig | null {
        return this.configCache.get(guildId)?.get(logType) ?? null;
    }

    /**
     * Check if logging is enabled for a guild and log type
     */
    public isEnabled(guildId: string, logType: LogType): boolean {
        const config = this.getConfig(guildId, logType);
        return config?.enabled ?? false;
    }

    /**
     * Send a log embed to the configured channel
     */
    public async sendLog(
        guildId: string,
        logType: LogType,
        embed: EmbedBuilder
    ): Promise<void> {
        const config = this.getConfig(guildId, logType);
        if (!config) return;

        try {
            const channel = await this.client.channels.fetch(config.channelId);

            if (!channel || !(channel instanceof TextChannel)) {
                logger.warn(
                    { guildId, logType, channelId: config.channelId },
                    'Log channel not found or not a text channel'
                );
                return;
            }

            // Set default color if not already set
            if (!embed.data.color) {
                embed.setColor(LOG_COLORS[logType]);
            }

            // Add timestamp if not already set
            if (!embed.data.timestamp) {
                embed.setTimestamp();
            }

            await channel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(
                { error, guildId, logType },
                'Failed to send log message'
            );
        }
    }

    /**
     * Create a base embed with consistent styling
     */
    public createEmbed(logType: LogType, title: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(LOG_COLORS[logType])
            .setTitle(title)
            .setTimestamp();
    }

    /**
     * Check filters to see if this event should be logged
     */
    public shouldLog(
        guildId: string,
        logType: LogType,
        context: { userId?: string; channelId?: string; isBot?: boolean }
    ): boolean {
        const config = this.getConfig(guildId, logType);
        if (!config?.enabled) return false;

        const filters = config.filters;

        // Check ignore bots filter
        if (filters.ignoreBots && context.isBot) {
            return false;
        }

        // Check ignored channels
        if (
            context.channelId &&
            Array.isArray(filters.ignoreChannels) &&
            filters.ignoreChannels.includes(context.channelId)
        ) {
            return false;
        }

        // Check ignored users
        if (
            context.userId &&
            Array.isArray(filters.ignoreUsers) &&
            filters.ignoreUsers.includes(context.userId)
        ) {
            return false;
        }

        return true;
    }
}

/**
 * Truncate content to specified length with ellipsis
 */
export function truncateContent(content: string, maxLength = 1024): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength - 3) + '...';
}

/**
 * Format a Discord snowflake timestamp
 */
export function formatTimestamp(snowflake: string): string {
    const timestamp = Number(BigInt(snowflake) >> 22n) + 1420070400000;
    return `<t:${Math.floor(timestamp / 1000)}:R>`;
}
