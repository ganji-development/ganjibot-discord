/**
 * Discord.js Client
 * Extended client with addon integration
 */

import {
    Client,
    GatewayIntentBits,
    Partials,
    type ClientEvents,
} from 'discord.js';
import { createLogger } from '../logging/index.js';
import { LogService } from '../logging/LogService.js';
import {
    registerMessageLoggers,
    registerMemberLoggers,
    registerVoiceLoggers,
    registerModerationLoggers,
} from '../logging/loggers/index.js';
import { EventDispatcher } from './EventDispatcher.js';
import { CommandHandler } from './CommandHandler.js';
import type { AddonManager } from '../addons/index.js';
import { pingCommand, helpCommand, infoCommand } from './commands/index.js';

const logger = createLogger('bot:client');

/**
 * Extended Discord.js Client with addon integration
 */
export class GanjibotClient extends Client {
    public readonly eventDispatcher: EventDispatcher;
    public readonly commandHandler: CommandHandler;
    public readonly addonManager: AddonManager;
    public readonly logService: LogService;

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
        this.logService = new LogService(this);

        this.setupBaseEvents();
    }

    /**
     * Set up core bot events
     */
    private setupBaseEvents(): void {
        this.once('ready', async () => {
            logger.info(
                { user: this.user?.tag, guilds: this.guilds.cache.size },
                'Bot is ready'
            );

            // Register core commands
            this.registerCoreCommands();

            // Register addon commands and events
            await this.registerAddonFeatures();

            // Initialize logging system
            await this.initializeLogging();

            // Deploy commands to Discord
            try {
                await this.commandHandler.deploy();
            } catch (error) {
                logger.error({ error }, 'Failed to deploy commands');
            }
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

        // Guild events for tracking
        this.on('guildCreate', (guild) => {
            logger.info({ guildId: guild.id, name: guild.name }, 'Joined guild');
        });

        this.on('guildDelete', (guild) => {
            logger.info({ guildId: guild.id, name: guild.name }, 'Left guild');
        });
    }

    /**
     * Register built-in core commands
     */
    private registerCoreCommands(): void {
        logger.debug('Registering core commands');

        this.commandHandler.register(pingCommand);
        this.commandHandler.register(helpCommand);
        this.commandHandler.register(infoCommand);

        logger.info({ count: 3 }, 'Core commands registered');
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

    /**
     * Initialize the logging system and register all loggers
     */
    private async initializeLogging(): Promise<void> {
        await this.logService.initialize();

        // Register all event loggers
        registerMessageLoggers(this.logService);
        registerMemberLoggers(this.logService);
        registerVoiceLoggers(this.logService);
        registerModerationLoggers(this.logService);

        logger.info('Logging system initialized');
    }
}

/**
 * Factory function to create the bot client
 */
export function createClient(addonManager: AddonManager): GanjibotClient {
    return new GanjibotClient(addonManager);
}
