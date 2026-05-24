/**
 * Discord.js Client
 * Extended client with addon integration
 */

import {
    Client,
    GatewayIntentBits,
    Partials,
    type ClientEvents,
    type Guild,
} from 'discord.js';
import { createLogger } from '../logging/index.js';
import { EventDispatcher } from './EventDispatcher.js';
import { CommandHandler } from './CommandHandler.js';
import type { AddonManager } from '../addons/index.js';
import { pingCommand, helpCommand, infoCommand, channelCommand, settingsCommand } from './commands/index.js';
import { prisma } from '../database/index.js';

const logger = createLogger('bot:client');

/**
 * Extended Discord.js Client with addon integration
 */
export class GanjibotClient extends Client {
    public readonly eventDispatcher: EventDispatcher;
    public readonly commandHandler: CommandHandler;
    public readonly addonManager: AddonManager;

    constructor(addonManager: AddonManager) {
        super({
            intents: [
                // Guilds
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildWebhooks,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences,

                // Messages
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.MessageContent,

                // Scheduled Events
                GatewayIntentBits.GuildScheduledEvents,

                // Auto Moderation
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.User,
                Partials.GuildMember,
                Partials.Reaction,
            ],
        });

        this.addonManager = addonManager;
        this.eventDispatcher = new EventDispatcher(this, addonManager);
        this.commandHandler = new CommandHandler(this, addonManager);

        this.setupBaseEvents();
    }

    /**
     * Set up core bot events
     */
    private setupBaseEvents(): void {
        this.once('clientReady', async () => {
            logger.info(
                { user: this.user?.tag, guilds: this.guilds.cache.size },
                'Bot is ready'
            );

            // Register core commands
            this.registerCoreCommands();

            // Register addon commands and events
            await this.registerAddonFeatures();

            // Deploy commands to Discord
            try {
                await this.commandHandler.deploy();
            } catch (error) {
                logger.error({ error }, 'Failed to deploy commands');
            }

            // Sync all current guilds to database for dashboard
            await this.syncAllGuilds();
        });

        this.on('error', (error) => {
            logger.error({ error }, 'Discord client error');
        });

        this.on('warn', (message) => {
            logger.warn({ message }, 'Discord client warning');
        });

        this.on('shardError', (error, shardId) => {
            logger.error({ error, shardId }, 'Shard error');
        });

        this.on('shardReady', (shardId) => {
            logger.info({ shardId }, 'Shard ready');
        });

        this.on('shardDisconnect', (event, shardId) => {
            logger.warn({ shardId, code: event.code }, 'Shard disconnected');
        });

        this.on('shardReconnecting', (shardId) => {
            logger.info({ shardId }, 'Shard reconnecting');
        });

        // Guild events - sync to database
        this.on('guildCreate', async (guild) => {
            logger.info({ guildId: guild.id, name: guild.name }, 'Joined guild');
            await this.syncGuildToDatabase(guild);
        });

        this.on('guildDelete', async (guild) => {
            logger.info({ guildId: guild.id, name: guild.name }, 'Left guild');
            // Optionally delete guild from database
            // For now, we keep the record for data retention
        });

        this.on('guildUpdate', async (_, newGuild) => {
            await this.syncGuildToDatabase(newGuild);
        });
    }

    /**
     * Sync a guild to the database
     */
    private async syncGuildToDatabase(guild: Guild): Promise<void> {
        try {
            await prisma.guild.upsert({
                where: { id: guild.id },
                create: {
                    id: guild.id,
                    name: guild.name,
                    iconHash: guild.icon,
                    ownerId: guild.ownerId,
                    settings: {},
                },
                update: {
                    name: guild.name,
                    iconHash: guild.icon,
                    ownerId: guild.ownerId,
                },
            });
            logger.debug({ guildId: guild.id }, 'Guild synced to database');
        } catch (error) {
            logger.error({ error, guildId: guild.id }, 'Failed to sync guild to database');
        }
    }

    /**
     * Sync all current guilds to the database
     */
    public async syncAllGuilds(): Promise<void> {
        logger.info({ count: this.guilds.cache.size }, 'Syncing all guilds to database');

        for (const guild of this.guilds.cache.values()) {
            await this.syncGuildToDatabase(guild);
        }

        logger.info('All guilds synced to database');
    }

    /**
     * Register built-in core commands
     */
    private registerCoreCommands(): void {
        logger.debug('Registering core commands');

        this.commandHandler.register(pingCommand);
        this.commandHandler.register(helpCommand);
        this.commandHandler.register(infoCommand);
        this.commandHandler.register(channelCommand);
        this.commandHandler.register(settingsCommand);

        logger.info({ count: 5 }, 'Core commands registered');
    }

    /**
     * Register addon commands and event listeners
     */
    private async registerAddonFeatures(): Promise<void> {
        const addons = this.addonManager.getAll();
        let commandCount = 0;
        let eventCount = 0;

        for (const addon of addons) {
            // Register addon commands
            for (const cmd of addon.manifest.commands) {
                this.commandHandler.register({
                    data: {
                        name: cmd.name,
                        description: cmd.description,
                        options: cmd.options?.map((opt) => ({
                            name: opt.name,
                            description: opt.description,
                            type: this.mapOptionType(opt.type),
                            required: opt.required ?? false,
                            choices: opt.choices,
                        })) ?? [],
                    },
                    execute: cmd.handler,
                    source: addon.id,
                });
                commandCount++;
            }

            // Register addon event listeners
            for (const listener of addon.manifest.eventListeners) {
                this.eventDispatcher.register(
                    listener.event,
                    listener.handler,
                    {
                        ...(listener.priority !== undefined && { priority: listener.priority }),
                        source: addon.id,
                    }
                );
                eventCount++;
            }
        }

        if (addons.length > 0) {
            logger.info(
                { addons: addons.length, commands: commandCount, events: eventCount },
                'Addon features registered'
            );
        }
    }

    /**
     * Map addon command option type to Discord.js option type number
     */
    private mapOptionType(type: string): number {
        const typeMap: Record<string, number> = {
            string: 3,
            integer: 4,
            boolean: 5,
            user: 6,
            channel: 7,
            role: 8,
        };
        return typeMap[type] ?? 3; // Default to string
    }


}

/**
 * Factory function to create the bot client
 */
export function createClient(addonManager: AddonManager): GanjibotClient {
    return new GanjibotClient(addonManager);
}
