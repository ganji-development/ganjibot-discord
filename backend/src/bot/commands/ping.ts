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
        const sent = await interaction.reply({
            content: '🏓 Pinging...',
            fetchReply: true,
        });

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        await interaction.editReply(
            `🏓 **Pong!**\n` +
            `📡 Roundtrip: \`${roundtrip}ms\`\n` +
            `💓 WebSocket: \`${wsLatency}ms\``
        );
    },
};
