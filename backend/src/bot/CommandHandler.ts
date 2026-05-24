/**
 * Command Handler
 * Handles slash command interactions
 */

import {
    type ChatInputCommandInteraction,
    type Client,
    Collection,
    REST,
    Routes,
    SlashCommandBuilder,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { createLogger } from '../logging/index.js';
import { config } from '../config/index.js';
import { prisma } from '../database/index.js';
import type { AddonManager } from '../addons/index.js';

const logger = createLogger('bot:commands');

export interface Command {
    data: SlashCommandBuilder | RESTPostAPIChatInputApplicationCommandsJSONBody;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    source: string; // 'core' or addon ID
}

/**
 * Handles slash command registration and execution
 */
export class CommandHandler {
    private readonly client: Client;
    private readonly addonManager: AddonManager;
    private readonly commands: Collection<string, Command> = new Collection();
    private readonly rest: REST;

    constructor(client: Client, addonManager: AddonManager) {
        this.client = client;
        this.addonManager = addonManager;
        this.rest = new REST({ version: '10' }).setToken(config.discord.token);

        this.setupInteractionHandler();
    }

    /**
     * Register a command
     */
    public register(command: Command): void {
        const name =
            command.data instanceof SlashCommandBuilder
                ? command.data.name
                : command.data.name;

        if (this.commands.has(name)) {
            logger.warn(
                { name, existingSource: this.commands.get(name)?.source },
                'Command already registered, overwriting'
            );
        }

        this.commands.set(name, command);
        logger.debug({ name, source: command.source }, 'Registered command');
    }

    /**
     * Unregister all commands from a specific source
     */
    public unregisterBySource(source: string): void {
        const toRemove: string[] = [];

        for (const [name, command] of this.commands.entries()) {
            if (command.source === source) {
                toRemove.push(name);
            }
        }

        for (const name of toRemove) {
            this.commands.delete(name);
            logger.debug({ name, source }, 'Unregistered command');
        }
    }

    /**
     * Deploy commands to Discord
     * In development, deploys to a specific guild for instant updates
     * In production, deploys globally
     */
    public async deploy(): Promise<void> {
        const commandsJson = this.commands.map((cmd) =>
            cmd.data instanceof SlashCommandBuilder ? cmd.data.toJSON() : cmd.data
        );

        try {
            if (config.discord.devGuildId && config.env === 'development') {
                // Deploy to development guild (instant update)
                await this.rest.put(
                    Routes.applicationGuildCommands(
                        config.discord.clientId,
                        config.discord.devGuildId
                    ),
                    { body: commandsJson }
                );
                logger.info(
                    { count: commandsJson.length, guildId: config.discord.devGuildId },
                    'Deployed commands to development guild'
                );
            } else {
                // Deploy globally (may take up to 1 hour to propagate)
                await this.rest.put(
                    Routes.applicationCommands(config.discord.clientId),
                    { body: commandsJson }
                );
                logger.info(
                    { count: commandsJson.length },
                    'Deployed commands globally'
                );
            }
        } catch (error) {
            logger.error({ error }, 'Failed to deploy commands');
            throw error;
        }
    }

    /**
     * Set up the interaction handler
     */
    private setupInteractionHandler(): void {
        this.client.on('interactionCreate', async (interaction) => {
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn(
                        { commandName: interaction.commandName },
                        'Unknown command received'
                    );
                    return;
                }

                try {
                    await command.execute(interaction);
                    logger.debug(
                        {
                            commandName: interaction.commandName,
                            userId: interaction.user.id,
                            guildId: interaction.guildId,
                        },
                        'Command executed'
                    );

                    // Log to database if in a guild
                    if (interaction.guildId) {
                        try {
                            await prisma.auditLog.create({
                                data: {
                                    guildId: interaction.guildId,
                                    userId: interaction.user.id,
                                    action: 'COMMAND_EXECUTED',
                                    target: interaction.commandName,
                                    details: {
                                        channelId: interaction.channelId,
                                        options: interaction.options.data.map((opt) => ({
                                            name: opt.name,
                                            value: opt.value,
                                            type: opt.type,
                                        })),
                                        source: command.source,
                                    },
                                },
                            });
                        } catch (logError) {
                            logger.error(
                                { error: logError, commandName: interaction.commandName },
                                'Failed to create audit log entry'
                            );
                        }
                    }
                } catch (error) {
                    logger.error(
                        { error, commandName: interaction.commandName },
                        'Error executing command'
                    );

                    const content = 'There was an error executing this command.';

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral: true });
                    } else {
                        await interaction.reply({ content, ephemeral: true });
                    }
                }
                return;
            }

            // Handle component interactions (buttons, select menus, modals)
            await this.handleComponentInteraction(interaction);
        });
    }

    /**
     * Handle component interactions (buttons, select menus, modals)
     */
    private async handleComponentInteraction(interaction: any): Promise<void> {
        // Dynamic import to avoid circular dependencies
        const { 
            isSettingsInteraction,
            handleSettingsButton,
            handleSettingsStringSelect,
            handleSettingsChannelSelect,
            handleSettingsRoleSelect,
            handleSettingsModal
        } = await import('./commands/settings.js');

        try {
            // Check if this is a settings interaction
            if (interaction.customId && isSettingsInteraction(interaction.customId)) {
                if (interaction.isButton()) {
                    await handleSettingsButton(interaction);
                } else if (interaction.isStringSelectMenu()) {
                    await handleSettingsStringSelect(interaction);
                } else if (interaction.isChannelSelectMenu()) {
                    await handleSettingsChannelSelect(interaction);
                } else if (interaction.isRoleSelectMenu()) {
                    await handleSettingsRoleSelect(interaction);
                } else if (interaction.isModalSubmit()) {
                    await handleSettingsModal(interaction);
                }
                return;
            }

            // Add more component handlers here as needed
            // e.g., for ticket system, moderation actions, etc.

        } catch (error) {
            logger.error({ error, customId: interaction.customId }, 'Error handling component interaction');
            
            try {
                const content = 'There was an error processing this interaction.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, ephemeral: true });
                } else {
                    await interaction.reply({ content, ephemeral: true });
                }
            } catch {
                // Ignore if we can't respond
            }
        }
    }

    /**
     * Get all registered commands
     */
    public getCommands(): Collection<string, Command> {
        return this.commands;
    }
}
