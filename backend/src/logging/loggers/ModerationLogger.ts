/**
 * ModerationLogger - Logs moderation actions (timeout, kick from audit log)
 */

import { AuditLogEvent, type GuildAuditLogsEntry, type Guild, type User } from 'discord.js';
import { LogService, type LogType } from '../LogService.js';
import { createLogger } from '../index.js';

const logger = createLogger('moderation-logger');

/**
 * Register moderation logging events
 */
export function registerModerationLoggers(logService: LogService): void {
    const client = (logService as any).client;

    // Poll audit logs periodically for moderation actions
    // This is more reliable than hoping to catch events in real-time
    const trackedActions = new Set<string>();

    client.on('guildAuditLogEntryCreate', async (entry: GuildAuditLogsEntry, guild: Guild) => {
        const guildId = guild.id;
        const logType: LogType = 'MODERATION';

        if (!logService.isEnabled(guildId, logType)) return;

        // Avoid duplicate logs
        if (trackedActions.has(entry.id)) return;
        trackedActions.add(entry.id);

        // Clean up old entries (keep last 1000)
        if (trackedActions.size > 1000) {
            const firstKey = trackedActions.keys().next().value;
            if (firstKey) trackedActions.delete(firstKey);
        }

        const executor = entry.executor;
        const target = entry.target;

        let actionName: string;
        let description: string;

        switch (entry.action) {
            case AuditLogEvent.MemberKick: {
                actionName = '👢 Member Kicked';
                const targetUser = target as User | null;
                description = targetUser ? `<@${targetUser.id}> was kicked from the server.` : 'A user was kicked from the server.';
                break;
            }

            case AuditLogEvent.MemberUpdate: {
                // Check for timeout
                if (entry.changes?.some(c => c.key === 'communication_disabled_until')) {
                    const timeoutChange = entry.changes.find(
                        c => c.key === 'communication_disabled_until'
                    );
                    const targetUser = target as User | null;
                    const targetMention = targetUser ? `<@${targetUser.id}>` : 'A user';

                    if (timeoutChange?.new) {
                        actionName = '⏱️ Member Timed Out';
                        const until = new Date(timeoutChange.new as string);
                        description = `${targetMention} was timed out until <t:${Math.floor(until.getTime() / 1000)}:F>.`;
                    } else {
                        actionName = '⏱️ Timeout Removed';
                        description = `Timeout was removed from ${targetMention}.`;
                    }
                } else {
                    return; // Not a timeout, skip
                }
                break;
            }

            case AuditLogEvent.MemberRoleUpdate:
                // Role changes are handled by MemberLogger
                return;

            case AuditLogEvent.MessageDelete:
                // Already handled by MessageLogger
                return;

            case AuditLogEvent.MessageBulkDelete:
                // Already handled by MessageLogger
                return;

            default:
                return; // Unhandled audit log type
        }

        const embed = logService.createEmbed(logType, actionName)
            .setDescription(description);

        if (executor) {
            embed.addFields({
                name: 'Moderator',
                value: `<@${executor.id}> (${executor.tag})`,
                inline: true,
            });
        }

        if (entry.reason) {
            embed.addFields({ name: 'Reason', value: entry.reason });
        }

        if (target && 'id' in target) {
            embed.setFooter({ text: `Target ID: ${target.id}` });
        }

        await logService.sendLog(guildId, logType, embed);
    });

    logger.info('Moderation loggers registered');
}
