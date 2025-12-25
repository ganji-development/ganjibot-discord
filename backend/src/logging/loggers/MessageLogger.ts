/**
 * MessageLogger - Logs message edit/delete events
 */

import { EmbedBuilder, type Message, type PartialMessage, type Collection, type Snowflake } from 'discord.js';
import { LogService, truncateContent, type LogType } from '../LogService.js';
import { createLogger } from '../index.js';

const logger = createLogger('message-logger');

// Simple in-memory message cache for edit tracking
// In production, consider using Redis for larger scale
const messageCache = new Map<string, { content: string; authorId: string; authorTag: string }>();
const MAX_CACHE_SIZE = 10000;

/**
 * Cache a message for later reference (used for edit/delete logging)
 */
export function cacheMessage(message: Message): void {
    if (message.author.bot || !message.content) return;

    // Evict oldest entries if cache is full
    if (messageCache.size >= MAX_CACHE_SIZE) {
        const firstKey = messageCache.keys().next().value;
        if (firstKey) messageCache.delete(firstKey);
    }

    messageCache.set(message.id, {
        content: message.content,
        authorId: message.author.id,
        authorTag: message.author.tag,
    });
}

/**
 * Get a cached message
 */
export function getCachedMessage(messageId: string): { content: string; authorId: string; authorTag: string } | undefined {
    return messageCache.get(messageId);
}

/**
 * Register message logging events
 */
export function registerMessageLoggers(logService: LogService): void {
    const client = (logService as any).client;

    // Cache messages on create for later reference
    client.on('messageCreate', (message: Message) => {
        if (message.guild) {
            cacheMessage(message);
        }
    });

    // Message Edit
    client.on('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        if (!newMessage.guild || !newMessage.author) return;

        const guildId = newMessage.guild.id;
        const logType: LogType = 'MESSAGE_EDIT';

        if (!logService.shouldLog(guildId, logType, {
            userId: newMessage.author.id,
            channelId: newMessage.channel.id,
            isBot: newMessage.author.bot,
        })) return;

        // Get old content from cache or partial
        let oldContent = oldMessage.content ?? getCachedMessage(newMessage.id)?.content ?? '*Content not cached*';
        const newContent = newMessage.content ?? '*No content*';

        // Skip if content didn't actually change (embed-only updates)
        if (oldContent === newContent) return;

        const embed = logService.createEmbed(logType, '📝 Message Edited')
            .addFields(
                { name: 'Author', value: `<@${newMessage.author.id}> (${newMessage.author.tag})`, inline: true },
                { name: 'Channel', value: `<#${newMessage.channel.id}>`, inline: true },
                { name: 'Before', value: truncateContent(oldContent) },
                { name: 'After', value: truncateContent(newContent) }
            )
            .setFooter({ text: `Message ID: ${newMessage.id}` });

        if (newMessage.author.avatarURL()) {
            embed.setThumbnail(newMessage.author.avatarURL());
        }

        await logService.sendLog(guildId, logType, embed);

        // Update cache
        if (newMessage.content) {
            messageCache.set(newMessage.id, {
                content: newMessage.content,
                authorId: newMessage.author.id,
                authorTag: newMessage.author.tag,
            });
        }
    });

    // Message Delete
    client.on('messageDelete', async (message: Message | PartialMessage) => {
        if (!message.guild) return;

        const guildId = message.guild.id;
        const logType: LogType = 'MESSAGE_DELETE';

        // Get cached info or use partial data
        const cached = getCachedMessage(message.id);
        const authorId = message.author?.id ?? cached?.authorId;
        const authorTag = message.author?.tag ?? cached?.authorTag ?? 'Unknown#0000';
        const content = message.content ?? cached?.content ?? '*Content not cached*';

        if (authorId && !logService.shouldLog(guildId, logType, {
            userId: authorId,
            channelId: message.channel.id,
            ...(message.author?.bot !== undefined && { isBot: message.author.bot }),
        })) return;

        const embed = logService.createEmbed(logType, '🗑️ Message Deleted')
            .addFields(
                { name: 'Author', value: authorId ? `<@${authorId}> (${authorTag})` : 'Unknown', inline: true },
                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Content', value: truncateContent(content) }
            )
            .setFooter({ text: `Message ID: ${message.id}` });

        await logService.sendLog(guildId, logType, embed);

        // Remove from cache
        messageCache.delete(message.id);
    });

    // Bulk Message Delete
    client.on('messageDeleteBulk', async (messages: Collection<Snowflake, Message | PartialMessage>) => {
        const firstMessage = messages.first();
        if (!firstMessage?.guild) return;

        const guildId = firstMessage.guild.id;
        const logType: LogType = 'MESSAGE_BULK_DELETE';

        if (!logService.isEnabled(guildId, logType)) return;

        const embed = logService.createEmbed(logType, '🗑️ Bulk Messages Deleted')
            .addFields(
                { name: 'Channel', value: `<#${firstMessage.channel.id}>`, inline: true },
                { name: 'Count', value: `${messages.size} messages`, inline: true }
            )
            .setDescription(
                'Multiple messages were deleted at once. This is usually from moderation actions or bot cleanup.'
            );

        await logService.sendLog(guildId, logType, embed);

        // Remove from cache
        for (const msg of messages.values()) {
            messageCache.delete(msg.id);
        }
    });

    logger.info('Message loggers registered');
}
