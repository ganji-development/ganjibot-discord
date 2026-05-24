/**
 * Settings Command - Interactive Menu
 * Single /settings command with buttons, select menus, and modals
 */

import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type ButtonInteraction,
    type StringSelectMenuInteraction,
    type RoleSelectMenuInteraction,
    type ChannelSelectMenuInteraction,
    type ModalSubmitInteraction,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
} from 'discord.js';
import type { Command } from '../CommandHandler.js';
import { graphqlRequest } from '../apiClient.js';

// Custom IDs for component interactions
const CUSTOM_IDS = {
    // Navigation buttons
    BTN_GENERAL: 'settings:general',
    BTN_LOGGING: 'settings:logging',
    BTN_ACCESS: 'settings:access',
    BTN_BACK: 'settings:back',
    
    // Edit buttons
    BTN_EDIT_GENERAL: 'settings:edit:general',
    BTN_EDIT_LOGGING: 'settings:edit:logging',
    
    // Select menus
    SELECT_LOG_TYPE: 'settings:select:logtype',
    SELECT_LOG_CHANNEL: 'settings:select:logchannel',
    SELECT_ACCESS_ROLE: 'settings:select:role',
    SELECT_ACCESS_LEVEL: 'settings:select:level',
    
    // Modals
    MODAL_GENERAL: 'settings:modal:general',
};

// Embed colors
const COLORS = {
    PRIMARY: 0x5865F2,   // Discord blurple
    GENERAL: 0x3498db,   // Blue
    LOGGING: 0x9b59b6,   // Purple
    ACCESS: 0xe74c3c,    // Red
    SUCCESS: 0x2ecc71,   // Green
};

/**
 * Build the main menu embed and buttons
 */
function buildMainMenu(): { embed: EmbedBuilder; row: ActionRowBuilder<ButtonBuilder> } {
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Server Settings')
        .setDescription('Configure your server settings using the buttons below.')
        .addFields(
            { name: '📋 General', value: 'System channel, timezone, locale', inline: true },
            { name: '📜 Logging', value: 'Configure log channels', inline: true },
            { name: '🛡️ Access', value: 'Dashboard permissions', inline: true }
        )
        .setColor(COLORS.PRIMARY);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_GENERAL)
            .setLabel('General')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_LOGGING)
            .setLabel('Logging')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_ACCESS)
            .setLabel('Access')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

/**
 * Build the general settings view
 */
async function buildGeneralView(guildId: string, userId: string): Promise<{
    embed: EmbedBuilder;
    row: ActionRowBuilder<ButtonBuilder>;
}> {
    const query = `
        query GetSettings($guildId: ID!) {
            guild(id: $guildId) {
                settings
            }
        }
    `;
    
    const data = await graphqlRequest(query, { guildId }, userId);
    const settings = data.guild?.settings || {};

    const embed = new EmbedBuilder()
        .setTitle('📋 General Settings')
        .addFields(
            { name: 'System Channel', value: settings.systemChannelId ? `<#${settings.systemChannelId}>` : '*Not set*', inline: true },
            { name: 'Timezone', value: settings.timezone || 'UTC', inline: true },
            { name: 'Locale', value: settings.locale || 'en-US', inline: true }
        )
        .setColor(COLORS.GENERAL);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_BACK)
            .setLabel('Back')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_EDIT_GENERAL)
            .setLabel('Edit')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary)
    );

    return { embed, row };
}

/**
 * Build the logging settings view
 */
async function buildLoggingView(guildId: string, userId: string): Promise<{
    embed: EmbedBuilder;
    rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
}> {
    const query = `
        query GetLogConfig($guildId: ID!) {
            guild(id: $guildId) {
                logConfig {
                    modLogChannelId
                    serverLogChannelId
                    voiceLogChannelId
                    joinLeaveLogChannelId
                    commandLogChannelId
                }
            }
        }
    `;
    
    const data = await graphqlRequest(query, { guildId }, userId);
    const config = data.guild?.logConfig || {};

    const embed = new EmbedBuilder()
        .setTitle('📜 Logging Configuration')
        .addFields(
            { name: 'Moderation', value: config.modLogChannelId ? `<#${config.modLogChannelId}>` : '*Disabled*', inline: true },
            { name: 'Server Updates', value: config.serverLogChannelId ? `<#${config.serverLogChannelId}>` : '*Disabled*', inline: true },
            { name: 'Voice Activity', value: config.voiceLogChannelId ? `<#${config.voiceLogChannelId}>` : '*Disabled*', inline: true },
            { name: 'Join/Leave', value: config.joinLeaveLogChannelId ? `<#${config.joinLeaveLogChannelId}>` : '*Disabled*', inline: true },
            { name: 'Commands', value: config.commandLogChannelId ? `<#${config.commandLogChannelId}>` : '*Disabled*', inline: true }
        )
        .setColor(COLORS.LOGGING)
        .setFooter({ text: 'Select a log type below to configure' });

    const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_BACK)
            .setLabel('Back')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(CUSTOM_IDS.SELECT_LOG_TYPE)
            .setPlaceholder('Select log type to configure...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Moderation Logs')
                    .setValue('modLogChannelId')
                    .setEmoji('🔨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Server Updates')
                    .setValue('serverLogChannelId')
                    .setEmoji('📢'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Voice Activity')
                    .setValue('voiceLogChannelId')
                    .setEmoji('🔊'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Join/Leave')
                    .setValue('joinLeaveLogChannelId')
                    .setEmoji('👋'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Command Logs')
                    .setValue('commandLogChannelId')
                    .setEmoji('⌨️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Disable All')
                    .setValue('disable_all')
                    .setEmoji('🚫')
            )
    );

    return { embed, rows: [selectRow, backRow] };
}

/**
 * Build the access settings view
 */
async function buildAccessView(guildId: string, userId: string): Promise<{
    embed: EmbedBuilder;
    rows: ActionRowBuilder<ButtonBuilder | RoleSelectMenuBuilder | StringSelectMenuBuilder>[];
}> {
    const query = `
        query GetAccess($guildId: ID!) {
            guild(id: $guildId) {
                accessGrants {
                    roleId
                    level
                    userId
                }
            }
        }
    `;
    
    const data = await graphqlRequest(query, { guildId }, userId);
    const grants = data.guild?.accessGrants || [];
    const roleGrants = grants.filter((g: any) => g.roleId);

    const list = roleGrants.length > 0
        ? roleGrants.map((g: any) => `<@&${g.roleId}> → **${g.level}**`).join('\n')
        : '*No role access configured*';

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Access Management')
        .setDescription('**Current Access Grants:**\n' + list)
        .setColor(COLORS.ACCESS)
        .setFooter({ text: 'Select a role to grant/revoke access' });

    const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(CUSTOM_IDS.BTN_BACK)
            .setLabel('Back')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    const roleSelectRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId(CUSTOM_IDS.SELECT_ACCESS_ROLE)
            .setPlaceholder('Select a role to manage...')
    );

    return { embed, rows: [roleSelectRow, backRow] };
}

/**
 * Build the general settings edit modal
 */
function buildGeneralModal(currentSettings: any): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.MODAL_GENERAL)
        .setTitle('Edit General Settings');

    const systemChannelInput = new TextInputBuilder()
        .setCustomId('systemChannelId')
        .setLabel('System Channel ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter channel ID or leave empty')
        .setValue(currentSettings.systemChannelId || '')
        .setRequired(false);

    const timezoneInput = new TextInputBuilder()
        .setCustomId('timezone')
        .setLabel('Timezone')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., America/New_York, UTC')
        .setValue(currentSettings.timezone || 'UTC')
        .setRequired(false);

    const localeInput = new TextInputBuilder()
        .setCustomId('locale')
        .setLabel('Locale')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., en-US, es-ES')
        .setValue(currentSettings.locale || 'en-US')
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(systemChannelInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(timezoneInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(localeInput)
    );

    return modal;
}

// Store for temporary state (log type selection, role selection)
const pendingSelections = new Map<string, { logType?: string | undefined; roleId?: string | undefined }>();

/**
 * Main command definition
 */
export const settingsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure server settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as any,

    source: 'core',

    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guildId) {
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        const { embed, row } = buildMainMenu();
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};

/**
 * Handle button interactions for settings
 */
export async function handleSettingsButton(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
        switch (interaction.customId) {
            case CUSTOM_IDS.BTN_BACK: {
                const { embed, row } = buildMainMenu();
                await interaction.update({ embeds: [embed], components: [row] });
                break;
            }
            
            case CUSTOM_IDS.BTN_GENERAL: {
                const { embed, row } = await buildGeneralView(guildId, userId);
                await interaction.update({ embeds: [embed], components: [row] });
                break;
            }
            
            case CUSTOM_IDS.BTN_LOGGING: {
                const { embed, rows } = await buildLoggingView(guildId, userId);
                await interaction.update({ embeds: [embed], components: rows });
                break;
            }
            
            case CUSTOM_IDS.BTN_ACCESS: {
                const { embed, rows } = await buildAccessView(guildId, userId);
                await interaction.update({ embeds: [embed], components: rows });
                break;
            }
            
            case CUSTOM_IDS.BTN_EDIT_GENERAL: {
                // Fetch current settings for modal
                const query = `query GetSettings($guildId: ID!) { guild(id: $guildId) { settings } }`;
                const data = await graphqlRequest(query, { guildId }, userId);
                const settings = data.guild?.settings || {};
                
                const modal = buildGeneralModal(settings);
                await interaction.showModal(modal);
                break;
            }
        }
    } catch (error: any) {
        console.error('Settings button error:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ Error: ${error.message}`, ephemeral: true });
        } else {
            await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
        }
    }
}

/**
 * Handle string select menu interactions for settings
 */
export async function handleSettingsStringSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const value = interaction.values[0];
    
    if (!value) return;

    try {
        if (interaction.customId === CUSTOM_IDS.SELECT_LOG_TYPE) {
            if (value === 'disable_all') {
                // Disable all logging
                const mutation = `
                    mutation UpdateLogConfig($guildId: ID!, $input: LogConfigInput!) {
                        updateLogConfig(guildId: $guildId, input: $input) { id }
                    }
                `;
                await graphqlRequest(mutation, {
                    guildId,
                    input: {
                        modLogChannelId: null,
                        serverLogChannelId: null,
                        voiceLogChannelId: null,
                        joinLeaveLogChannelId: null,
                        commandLogChannelId: null
                    }
                }, userId);
                
                const { embed, rows } = await buildLoggingView(guildId, userId);
                embed.setDescription('✅ All logging disabled');
                await interaction.update({ embeds: [embed], components: rows });
            } else {
                // Store the selected log type and show channel select
                pendingSelections.set(interaction.user.id, { logType: value });
                
                const logTypeNames: Record<string, string> = {
                    modLogChannelId: 'Moderation',
                    serverLogChannelId: 'Server Updates',
                    voiceLogChannelId: 'Voice Activity',
                    joinLeaveLogChannelId: 'Join/Leave',
                    commandLogChannelId: 'Command'
                };
                
                const embed = new EmbedBuilder()
                    .setTitle(`📜 Configure ${logTypeNames[value] ?? value} Logs`)
                    .setDescription('Select a channel for this log type, or select nothing to disable.')
                    .setColor(COLORS.LOGGING);
                
                const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId(CUSTOM_IDS.SELECT_LOG_CHANNEL)
                        .setPlaceholder('Select a text channel...')
                        .setChannelTypes(ChannelType.GuildText)
                        .setMinValues(0)
                );
                
                const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(CUSTOM_IDS.BTN_LOGGING)
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );
                
                await interaction.update({ embeds: [embed], components: [channelRow, backRow] });
            }
        } else if (interaction.customId === CUSTOM_IDS.SELECT_ACCESS_LEVEL) {
            // Grant access with selected level
            const pending = pendingSelections.get(interaction.user.id);
            if (!pending?.roleId) {
                await interaction.reply({ content: '❌ Please select a role first.', ephemeral: true });
                return;
            }
            
            const mutation = `
                mutation GrantAccess($guildId: ID!, $input: GrantAccessInput!) {
                    grantAccess(guildId: $guildId, input: $input) { id }
                }
            `;
            await graphqlRequest(mutation, {
                guildId,
                input: { roleId: pending.roleId, level: value }
            }, userId);
            
            pendingSelections.delete(interaction.user.id);
            
            const { embed, rows } = await buildAccessView(guildId, userId);
            embed.setDescription(`✅ Granted **${value}** access to <@&${pending.roleId}>`);
            await interaction.update({ embeds: [embed], components: rows });
        }
    } catch (error: any) {
        console.error('Settings select error:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Handle channel select menu interactions for settings
 */
export async function handleSettingsChannelSelect(interaction: ChannelSelectMenuInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
        if (interaction.customId === CUSTOM_IDS.SELECT_LOG_CHANNEL) {
            const pending = pendingSelections.get(interaction.user.id);
            if (!pending?.logType) {
                await interaction.reply({ content: '❌ Please select a log type first.', ephemeral: true });
                return;
            }
            
            const channelId = interaction.values.length > 0 ? interaction.values[0] : null;
            
            const mutation = `
                mutation UpdateLogConfig($guildId: ID!, $input: LogConfigInput!) {
                    updateLogConfig(guildId: $guildId, input: $input) { id }
                }
            `;
            await graphqlRequest(mutation, {
                guildId,
                input: { [pending.logType]: channelId }
            }, userId);
            
            pendingSelections.delete(interaction.user.id);
            
            const { embed, rows } = await buildLoggingView(guildId, userId);
            if (channelId) {
                embed.setDescription(`✅ Set log channel to <#${channelId}>`);
            } else {
                embed.setDescription('✅ Log channel disabled/unset');
            }
            await interaction.update({ embeds: [embed], components: rows });
        }
    } catch (error: any) {
        console.error('Settings channel select error:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Handle role select menu interactions for settings
 */
export async function handleSettingsRoleSelect(interaction: RoleSelectMenuInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
        if (interaction.customId === CUSTOM_IDS.SELECT_ACCESS_ROLE) {
            const roleId = interaction.values[0];
            pendingSelections.set(interaction.user.id, { roleId });
            
            // Show level selection
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Set Access Level')
                .setDescription(`Configure access for <@&${roleId}>`)
                .setColor(COLORS.ACCESS);
            
            const levelRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(CUSTOM_IDS.SELECT_ACCESS_LEVEL)
                    .setPlaceholder('Select access level...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Admin')
                            .setDescription('Full dashboard access')
                            .setValue('ADMIN')
                            .setEmoji('👑'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Moderator')
                            .setDescription('Moderation tools access')
                            .setValue('MODERATOR')
                            .setEmoji('🛡️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Viewer')
                            .setDescription('Read-only access')
                            .setValue('VIEWER')
                            .setEmoji('👁️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Revoke Access')
                            .setDescription('Remove access for this role')
                            .setValue('REVOKE')
                            .setEmoji('🚫')
                    )
            );
            
            const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(CUSTOM_IDS.BTN_ACCESS)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );
            
            await interaction.update({ embeds: [embed], components: [levelRow, backRow] });
        }
    } catch (error: any) {
        console.error('Settings role select error:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Handle modal submit interactions for settings
 */
export async function handleSettingsModal(interaction: ModalSubmitInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
        if (interaction.customId === CUSTOM_IDS.MODAL_GENERAL) {
            // Defer the modal response first
            await interaction.deferUpdate();
            
            const systemChannelId = interaction.fields.getTextInputValue('systemChannelId') || null;
            const timezone = interaction.fields.getTextInputValue('timezone') || 'UTC';
            const locale = interaction.fields.getTextInputValue('locale') || 'en-US';
            
            const mutation = `
                mutation UpdateSettings($guildId: ID!, $input: UpdateSettingsInput!) {
                    updateSettings(guildId: $guildId, input: $input) { id }
                }
            `;
            
            const input: any = { timezone, locale };
            if (systemChannelId) input.systemChannelId = systemChannelId;
            
            await graphqlRequest(mutation, { guildId, input }, userId);
            
            const { embed, row } = await buildGeneralView(guildId, userId);
            embed.setDescription('✅ Settings updated successfully!');
            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    } catch (error: any) {
        console.error('Settings modal error:', error);
        // Try to respond - may need different method depending on state
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: `❌ Error: ${error.message}` });
            } else {
                await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }
        } catch {
            // Ignore if we can't respond
        }
    }
}

/**
 * Check if an interaction custom ID belongs to settings
 */
export function isSettingsInteraction(customId: string): boolean {
    return customId.startsWith('settings:');
}
