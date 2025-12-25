/**
 * Help Command
 * List available commands with descriptions
 */

import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import type { Command } from '../CommandHandler.js';

export const helpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List available commands')
        .addStringOption((option) =>
            option
                .setName('command')
                .setDescription('Get detailed help for a specific command')
                .setRequired(false)
        )
        .toJSON(),

    source: 'core',

    execute: async (interaction: ChatInputCommandInteraction) => {
        const specificCommand = interaction.options.getString('command');
        const client = interaction.client;

        // Access the command handler through the client
        const commandHandler = (client as any).commandHandler;

        if (specificCommand) {
            // Show help for specific command
            const command = commandHandler?.getCommands()?.get(specificCommand);

            if (!command) {
                await interaction.reply({
                    content: `❌ Command \`${specificCommand}\` not found.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`📖 Command: /${specificCommand}`)
                .setDescription(
                    command.data instanceof SlashCommandBuilder
                        ? command.data.description
                        : command.data.description ?? 'No description available'
                )
                .addFields({ name: 'Source', value: command.source, inline: true })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // List all commands
        const commands = commandHandler?.getCommands();

        if (!commands || commands.size === 0) {
            await interaction.reply({
                content: 'No commands available.',
                ephemeral: true,
            });
            return;
        }

        // Group commands by source
        const coreCommands: string[] = [];
        const addonCommands: Map<string, string[]> = new Map();

        for (const [name, cmd] of commands.entries()) {
            if (cmd.source === 'core') {
                coreCommands.push(`\`/${name}\` - ${cmd.data instanceof SlashCommandBuilder
                    ? cmd.data.description
                    : cmd.data.description ?? 'No description'
                    }`);
            } else {
                const list = addonCommands.get(cmd.source) ?? [];
                list.push(`\`/${name}\``);
                addonCommands.set(cmd.source, list);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📚 Available Commands')
            .setDescription('Use `/help <command>` for detailed information about a command.')
            .setTimestamp()
            .setFooter({ text: `${commands.size} commands available` });

        if (coreCommands.length > 0) {
            embed.addFields({
                name: '🤖 Core Commands',
                value: coreCommands.join('\n'),
            });
        }

        for (const [source, cmds] of addonCommands.entries()) {
            embed.addFields({
                name: `📦 ${source}`,
                value: cmds.join(', '),
                inline: true,
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
