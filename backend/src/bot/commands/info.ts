/**
 * Info Command
 * Display bot information, uptime, and statistics
 */

import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    EmbedBuilder,
    version as djsVersion,
} from 'discord.js';
import type { Command } from '../CommandHandler.js';

/**
 * Format milliseconds into human-readable uptime string
 */
function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export const infoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display bot information and statistics'),

    source: 'core',

    execute: async (interaction: ChatInputCommandInteraction) => {
        const client = interaction.client;

        const uptime = client.uptime ?? 0;
        const guildCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0
        );
        const channelCount = client.channels.cache.size;

        // Get memory usage
        const memUsage = process.memoryUsage();

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🤖 Bot Information')
            .setThumbnail(client.user?.displayAvatarURL() ?? null)
            .addFields(
                {
                    name: '📊 Statistics',
                    value: [
                        `**Servers:** ${guildCount.toLocaleString()}`,
                        `**Users:** ${userCount.toLocaleString()}`,
                        `**Channels:** ${channelCount.toLocaleString()}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '⏱️ Uptime',
                    value: formatUptime(uptime),
                    inline: true,
                },
                {
                    name: '💻 System',
                    value: [
                        `**Memory:** ${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}`,
                        `**Node.js:** ${process.version}`,
                        `**Discord.js:** v${djsVersion}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '🔗 Links',
                    value: [
                        '[Dashboard](https://dashboard.example.com)',
                        '[Support Server](https://discord.gg/example)',
                        '[GitHub](https://github.com/ganjibot)',
                    ].join(' • '),
                }
            )
            .setTimestamp()
            .setFooter({ text: `Shard ${client.shard?.ids[0] ?? 0} • Ping: ${client.ws.ping}ms` });

        await interaction.reply({ embeds: [embed] });
    },
};
