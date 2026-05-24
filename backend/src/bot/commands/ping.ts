/**
 * Ping Command
 * Check bot latency and responsiveness
 */

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../CommandHandler.js';

export const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and responsiveness'),

    source: 'core',

    execute: async (interaction: ChatInputCommandInteraction) => {
        const response = await interaction.reply({
            content: '🏓 Pinging...',
            withResponse: true,
        });

        const sent = response.resource?.message;
        if (!sent) {
            await interaction.editReply('🏓 **Pong!** (Could not measure latency)');
            return;
        }

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        await interaction.editReply(
            `🏓 **Pong!**\n` +
            `📡 Roundtrip: \`${roundtrip}ms\`\n` +
            `💓 WebSocket: \`${wsLatency}ms\``
        );
    },
};
