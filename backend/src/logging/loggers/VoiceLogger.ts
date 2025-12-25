/**
 * VoiceLogger - Logs voice state changes
 */

import { EmbedBuilder, type VoiceState } from 'discord.js';
import { LogService, type LogType } from '../LogService.js';
import { createLogger } from '../index.js';

const logger = createLogger('voice-logger');

/**
 * Register voice logging events
 */
export function registerVoiceLoggers(logService: LogService): void {
    const client = (logService as any).client;

    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
        if (!newState.guild) return;

        const guildId = newState.guild.id;
        const logType: LogType = 'VOICE_STATE';

        const member = newState.member ?? oldState.member;
        if (!member) return;

        if (!logService.shouldLog(guildId, logType, {
            userId: member.id,
            isBot: member.user.bot,
        })) return;

        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        let action: string;
        let embed: EmbedBuilder;

        // Determine action type
        if (!oldChannel && newChannel) {
            // Joined voice channel
            action = 'joined';
            embed = logService.createEmbed(logType, '🔊 Voice Channel Joined')
                .addFields(
                    { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                    { name: 'Channel', value: `<#${newChannel.id}>`, inline: true }
                );
        } else if (oldChannel && !newChannel) {
            // Left voice channel
            action = 'left';
            embed = logService.createEmbed(logType, '🔇 Voice Channel Left')
                .addFields(
                    { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                    { name: 'Channel', value: `<#${oldChannel.id}>`, inline: true }
                );
        } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            // Moved between channels
            action = 'moved';
            embed = logService.createEmbed(logType, '🔀 Voice Channel Move')
                .addFields(
                    { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                    { name: 'From', value: `<#${oldChannel.id}>`, inline: true },
                    { name: 'To', value: `<#${newChannel.id}>`, inline: true }
                );
        } else {
            // Other state changes (mute, deafen, etc.)
            const changes: string[] = [];

            if (oldState.selfMute !== newState.selfMute) {
                changes.push(newState.selfMute ? '🔇 Self-muted' : '🔊 Self-unmuted');
            }
            if (oldState.selfDeaf !== newState.selfDeaf) {
                changes.push(newState.selfDeaf ? '🔇 Self-deafened' : '🔊 Self-undeafened');
            }
            if (oldState.serverMute !== newState.serverMute) {
                changes.push(newState.serverMute ? '🔇 Server muted' : '🔊 Server unmuted');
            }
            if (oldState.serverDeaf !== newState.serverDeaf) {
                changes.push(newState.serverDeaf ? '🔇 Server deafened' : '🔊 Server undeafened');
            }
            if (oldState.streaming !== newState.streaming) {
                changes.push(newState.streaming ? '📺 Started streaming' : '📺 Stopped streaming');
            }
            if (oldState.selfVideo !== newState.selfVideo) {
                changes.push(newState.selfVideo ? '📹 Camera on' : '📹 Camera off');
            }

            if (changes.length === 0) return; // No meaningful changes

            action = 'updated';
            embed = logService.createEmbed(logType, '🎙️ Voice State Update')
                .addFields(
                    { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                    { name: 'Channel', value: newChannel ? `<#${newChannel.id}>` : 'Unknown', inline: true },
                    { name: 'Changes', value: changes.join('\n') }
                );
        }

        embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `User ID: ${member.id}` });

        await logService.sendLog(guildId, logType, embed);
    });

    logger.info('Voice loggers registered');
}
