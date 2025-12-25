/**
 * MemberLogger - Logs member join/leave/update/ban events
 */

import {
    EmbedBuilder,
    type GuildMember,
    type PartialGuildMember,
    type GuildBan,
    type User,
} from 'discord.js';
import { LogService, formatTimestamp, type LogType } from '../LogService.js';
import { createLogger } from '../index.js';

const logger = createLogger('member-logger');

/**
 * Calculate account age in human readable format
 */
function getAccountAge(user: User): string {
    const createdAt = user.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days < 1) return 'Less than a day';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
}

/**
 * Register member logging events
 */
export function registerMemberLoggers(logService: LogService): void {
    const client = (logService as any).client;

    // Member Join
    client.on('guildMemberAdd', async (member: GuildMember) => {
        const guildId = member.guild.id;
        const logType: LogType = 'MEMBER_JOIN';

        if (!logService.shouldLog(guildId, logType, {
            userId: member.id,
            isBot: member.user.bot,
        })) return;

        const embed = logService.createEmbed(logType, '📥 Member Joined')
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                { name: 'Account Age', value: getAccountAge(member.user), inline: true },
                { name: 'Account Created', value: formatTimestamp(member.id), inline: true }
            )
            .setFooter({ text: `User ID: ${member.id} • Member #${member.guild.memberCount}` });

        // Warn about new accounts (less than 7 days old)
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        if (accountAgeMs < 7 * 24 * 60 * 60 * 1000) {
            embed.addFields({
                name: '⚠️ New Account',
                value: 'This account was created less than 7 days ago.',
            });
        }

        await logService.sendLog(guildId, logType, embed);
    });

    // Member Leave
    client.on('guildMemberRemove', async (member: GuildMember | PartialGuildMember) => {
        const guildId = member.guild.id;
        const logType: LogType = 'MEMBER_LEAVE';

        if (!logService.shouldLog(guildId, logType, {
            userId: member.id,
            isBot: member.user?.bot,
        })) return;

        const roles = member.roles?.cache
            .filter(r => r.id !== guildId) // Exclude @everyone
            .map(r => r.name)
            .join(', ') || 'None';

        const embed = logService.createEmbed(logType, '📤 Member Left')
            .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) ?? null)
            .addFields(
                { name: 'Member', value: member.user ? `<@${member.id}> (${member.user.tag})` : `<@${member.id}>`, inline: true },
                { name: 'Roles', value: roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles }
            )
            .setFooter({ text: `User ID: ${member.id}` });

        if (member.joinedAt) {
            const joinedDays = Math.floor((Date.now() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
            embed.addFields({
                name: 'Time in Server',
                value: joinedDays === 0 ? 'Less than a day' : `${joinedDays} days`,
                inline: true,
            });
        }

        await logService.sendLog(guildId, logType, embed);
    });

    // Member Update (roles, nickname)
    client.on('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
        const guildId = newMember.guild.id;
        const logType: LogType = 'MEMBER_UPDATE';

        if (!logService.shouldLog(guildId, logType, {
            userId: newMember.id,
            isBot: newMember.user.bot,
        })) return;

        const changes: { field: string; before: string; after: string }[] = [];

        // Check nickname change
        if (oldMember.nickname !== newMember.nickname) {
            changes.push({
                field: 'Nickname',
                before: oldMember.nickname ?? '*None*',
                after: newMember.nickname ?? '*None*',
            });
        }

        // Check role changes
        const oldRoles = new Set(oldMember.roles?.cache.keys() ?? []);
        const newRoles = new Set(newMember.roles.cache.keys());

        const addedRoles = [...newRoles].filter(r => !oldRoles.has(r) && r !== guildId);
        const removedRoles = [...oldRoles].filter(r => !newRoles.has(r) && r !== guildId);

        if (addedRoles.length > 0) {
            changes.push({
                field: 'Roles Added',
                before: '-',
                after: addedRoles.map(r => `<@&${r}>`).join(', '),
            });
        }

        if (removedRoles.length > 0) {
            changes.push({
                field: 'Roles Removed',
                before: removedRoles.map(r => `<@&${r}>`).join(', '),
                after: '-',
            });
        }

        // Only log if there were meaningful changes
        if (changes.length === 0) return;

        const embed = logService.createEmbed(logType, '✏️ Member Updated')
            .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
            .addFields({ name: 'Member', value: `<@${newMember.id}> (${newMember.user.tag})` });

        for (const change of changes) {
            embed.addFields(
                { name: change.field, value: `**Before:** ${change.before}\n**After:** ${change.after}` }
            );
        }

        embed.setFooter({ text: `User ID: ${newMember.id}` });

        await logService.sendLog(guildId, logType, embed);
    });

    // Member Ban
    client.on('guildBanAdd', async (ban: GuildBan) => {
        const guildId = ban.guild.id;
        const logType: LogType = 'MEMBER_BAN';

        if (!logService.shouldLog(guildId, logType, {
            userId: ban.user.id,
            isBot: ban.user.bot,
        })) return;

        const embed = logService.createEmbed(logType, '🔨 Member Banned')
            .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'User', value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true }
            )
            .setFooter({ text: `User ID: ${ban.user.id}` });

        if (ban.reason) {
            embed.addFields({ name: 'Reason', value: ban.reason });
        }

        await logService.sendLog(guildId, logType, embed);
    });

    // Member Unban
    client.on('guildBanRemove', async (ban: GuildBan) => {
        const guildId = ban.guild.id;
        const logType: LogType = 'MEMBER_UNBAN';

        if (!logService.isEnabled(guildId, logType)) return;

        const embed = logService.createEmbed(logType, '✅ Member Unbanned')
            .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'User', value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true }
            )
            .setFooter({ text: `User ID: ${ban.user.id}` });

        await logService.sendLog(guildId, logType, embed);
    });

    logger.info('Member loggers registered');
}
