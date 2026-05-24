/**
 * GraphQL Resolvers
 */

import { createLogger } from '../../logging/index.js';
import type { ApiContext } from '../server.js';
import { Prisma, AccessLevel } from '../../generated/prisma/client.js';
import { getUserAccessLevel, type EffectiveAccessLevel, can } from '../middleware/accessControl.js';
import { GraphQLError } from 'graphql';
import { ChannelType as DiscordChannelType } from 'discord.js';

const logger = createLogger('api:graphql');

// Helper to map Discord channel type to GraphQL enum
const mapChannelType = (type: DiscordChannelType): string => {
    switch (type) {
        case DiscordChannelType.GuildText: return 'GUILD_TEXT';
        case DiscordChannelType.GuildVoice: return 'GUILD_VOICE';
        case DiscordChannelType.GuildCategory: return 'GUILD_CATEGORY';
        case DiscordChannelType.GuildAnnouncement: return 'GUILD_ANNOUNCEMENT';
        case DiscordChannelType.GuildForum: return 'GUILD_FORUM';
        case DiscordChannelType.GuildStageVoice: return 'GUILD_STAGE_VOICE';
        default: return 'GUILD_TEXT';
    }
};

// Helper to map GraphQL enum to Discord channel type
const mapToDiscordChannelType = (type: string): DiscordChannelType => {
    switch (type) {
        case 'GUILD_TEXT': return DiscordChannelType.GuildText;
        case 'GUILD_VOICE': return DiscordChannelType.GuildVoice;
        case 'GUILD_CATEGORY': return DiscordChannelType.GuildCategory;
        case 'GUILD_ANNOUNCEMENT': return DiscordChannelType.GuildAnnouncement;
        case 'GUILD_FORUM': return DiscordChannelType.GuildForum;
        case 'GUILD_STAGE_VOICE': return DiscordChannelType.GuildStageVoice;
        default: return DiscordChannelType.GuildText;
    }
};

export const resolvers = {
    Query: {
        me: async (_: unknown, __: unknown, context: ApiContext) => {
            if (!context.userId) {
                return null;
            }

            // TODO: Fetch user from Discord API or cache
            return null;
        },

        guild: async (_: unknown, args: { id: string }, context: ApiContext) => {
            return context.prisma.guild.findUnique({
                where: { id: args.id },
                include: {
                    addons: {
                        include: { addon: true },
                    },
                    logConfig: true,
                },
            });
        },

        guilds: async (_: unknown, __: unknown, context: ApiContext) => {
            if (!context.userId) {
                return [];
            }

            // TODO: Filter by guilds the user has access to
            return context.prisma.guild.findMany({
                include: {
                    addons: {
                        include: { addon: true },
                    },
                },
            });
        },

        addon: async (_: unknown, args: { id: string }, context: ApiContext) => {
            return context.prisma.addon.findUnique({
                where: { id: args.id },
            });
        },

        addons: async (
            _: unknown,
            args: { installed?: boolean },
            context: ApiContext
        ) => {
            // TODO: Filter by installed status
            return context.prisma.addon.findMany();
        },

        guildChannels: async (_: unknown, args: { guildId: string }, context: ApiContext) => {
            if (!context.userId) return [];
            
            // Check access (VIEWER is enough to list)
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) return [];
            
            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.view(level)) return [];

            try {
                const guild = await context.client.guilds.fetch(args.guildId);
                const channels = await guild.channels.fetch();
                
                return channels
                    .filter(c => c && c.type !== DiscordChannelType.GuildCategory)
                    .map(c => ({
                        id: c!.id,
                        name: c!.name,
                        type: mapChannelType(c!.type),
                        parentId: c!.parentId,
                        position: c!.position,
                        createdAt: c!.createdAt
                    }))
                    .sort((a, b) => a.position - b.position);
            } catch (error) {
                logger.error({ err: error, guildId: args.guildId }, 'Failed to fetch guild channels');
                return [];
            }
        },

        guildCategories: async (_: unknown, args: { guildId: string }, context: ApiContext) => {
            if (!context.userId) return [];

            // Check access
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) return [];
            
            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.view(level)) return [];

            try {
                const guild = await context.client.guilds.fetch(args.guildId);
                const channels = await guild.channels.fetch();
                
                // Get all channels to map to categories
                const allChannels = Array.from(channels.values());
                const categories = allChannels.filter(c => c && c.type === DiscordChannelType.GuildCategory);
                
                return categories.map(cat => {
                    const children = allChannels
                        .filter(c => c && c.parentId === cat!.id)
                        .map(c => ({
                            id: c!.id,
                            name: c!.name,
                            type: mapChannelType(c!.type),
                            parentId: c!.parentId,
                            position: c!.position,
                            createdAt: c!.createdAt
                        }))
                        .sort((a, b) => a.position - b.position);

                    return {
                        id: cat!.id,
                        name: cat!.name,
                        position: cat!.position,
                        channels: children,
                        createdAt: cat!.createdAt
                    };
                }).sort((a, b) => a.position - b.position);
            } catch (error) {
                logger.error({ err: error, guildId: args.guildId }, 'Failed to fetch guild categories');
                return [];
            }
        },

        auditLogs: async (
            _: unknown,
            args: { guildId: string; limit?: number; offset?: number },
            context: ApiContext
        ) => {
            if (!context.userId) return [];

            // Check access (requires MODERATOR level)
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) return [];

            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.moderate(level)) return [];

            return context.prisma.auditLog.findMany({
                where: { guildId: args.guildId },
                orderBy: { createdAt: 'desc' },
                take: args.limit ?? 50,
                skip: args.offset ?? 0,
            });
        },
    },

    Mutation: {
        installAddon: async (
            _: unknown,
            args: { guildId: string; addonId: string },
            context: ApiContext
        ) => {
            logger.info(
                { guildId: args.guildId, addonId: args.addonId },
                'Installing addon'
            );

            // Create guild-addon association
            return context.prisma.guildAddon.create({
                data: {
                    guildId: args.guildId,
                    addonId: args.addonId,
                    enabled: false,
                    config: {},
                },
                include: {
                    guild: true,
                    addon: true,
                },
            });
        },

        uninstallAddon: async (
            _: unknown,
            args: { guildId: string; addonId: string },
            context: ApiContext
        ) => {
            logger.info(
                { guildId: args.guildId, addonId: args.addonId },
                'Uninstalling addon'
            );

            await context.prisma.guildAddon.delete({
                where: {
                    guildId_addonId: {
                        guildId: args.guildId,
                        addonId: args.addonId,
                    },
                },
            });

            return true;
        },

        enableAddon: async (
            _: unknown,
            args: { guildId: string; addonId: string },
            context: ApiContext
        ) => {
            // Enable in database
            const guildAddon = await context.prisma.guildAddon.update({
                where: {
                    guildId_addonId: {
                        guildId: args.guildId,
                        addonId: args.addonId,
                    },
                },
                data: { enabled: true },
                include: {
                    guild: true,
                    addon: true,
                },
            });

            // Enable in runtime
            await context.addonManager.enableForGuild(args.addonId, args.guildId);

            return guildAddon;
        },

        disableAddon: async (
            _: unknown,
            args: { guildId: string; addonId: string },
            context: ApiContext
        ) => {
            // Disable in database
            const guildAddon = await context.prisma.guildAddon.update({
                where: {
                    guildId_addonId: {
                        guildId: args.guildId,
                        addonId: args.addonId,
                    },
                },
                data: { enabled: false },
                include: {
                    guild: true,
                    addon: true,
                },
            });

            // Disable in runtime
            await context.addonManager.disableForGuild(args.addonId, args.guildId);

            return guildAddon;
        },

        updateAddonConfig: async (
            _: unknown,
            args: { guildId: string; addonId: string; config: Record<string, unknown> },
            context: ApiContext
        ) => {
            return context.prisma.guildAddon.update({
                where: {
                    guildId_addonId: {
                        guildId: args.guildId,
                        addonId: args.addonId,
                    },
                },
                data: { config: args.config as Prisma.InputJsonValue },
                include: {
                    guild: true,
                    addon: true,
                },
            });
        },



        createChannel: async (
            _: unknown,
            args: {
                guildId: string;
                input: {
                    name: string;
                    type: string;
                    parentId?: string;
                    position?: number;
                    topic?: string;
                    nsfw?: boolean;
                };
            },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                const guild = await context.client.guilds.fetch(args.guildId);
                
                const createData: any = {
                    name: args.input.name,
                    type: mapToDiscordChannelType(args.input.type),
                };
                
                if (args.input.parentId !== undefined) createData.parent = args.input.parentId;
                if (args.input.position !== undefined) createData.position = args.input.position;
                if (args.input.topic !== undefined) createData.topic = args.input.topic;
                if (args.input.nsfw !== undefined) createData.nsfw = args.input.nsfw;

                const channel = await guild.channels.create(createData);

                return {
                    id: channel.id,
                    name: channel.name,
                    type: mapChannelType(channel.type),
                    parentId: channel.parentId,
                    position: channel.position,
                    createdAt: channel.createdAt
                };
            } catch (error: any) {
                logger.error({ err: error, guildId: args.guildId }, 'Failed to create channel');
                throw new GraphQLError(`Failed to create channel: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        updateChannel: async (
            _: unknown,
            args: {
                channelId: string;
                input: {
                    name?: string;
                    parentId?: string;
                    position?: number;
                    topic?: string;
                    nsfw?: boolean;
                };
            },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            // We need to fetch the channel first to know the guild ID and check permissions
            // But we can't easily query by channel ID globally without sharding helper or iterating.
            // Assuming we are in single process or context.client can fetch.
            // Client.channels.fetch(id) works if cached or fetched.
            
            let channel;
            try {
                channel = await context.client.channels.fetch(args.channelId);
            } catch (e) {
                // ignore
            }

            if (!channel || channel.isDMBased()) {
                 throw new GraphQLError('Channel not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const guild = channel.guild;
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found (in DB)', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(guild.id, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                const editData: any = {};
                if (args.input.name !== undefined) editData.name = args.input.name;
                if (args.input.parentId !== undefined) editData.parent = args.input.parentId;
                if (args.input.position !== undefined) editData.position = args.input.position;
                if (args.input.topic !== undefined) editData.topic = args.input.topic;
                if (args.input.nsfw !== undefined) editData.nsfw = args.input.nsfw;

                const updated = await channel.edit(editData);

                // 'updated' could be a ThreadChannel which doesn't have position.
                // But we filtered for standard channels in our usage usually.
                // We cast to any to access position safely if it exists, or undefined.
                // For GuildChannels, it exists.
                const updatedAny = updated as any;

                return {
                    id: updated.id,
                    name: updated.name,
                    type: mapChannelType(updated.type),
                    parentId: updated.parentId,
                    position: updatedAny.position ?? 0,
                    createdAt: updated.createdAt
                };
            } catch (error: any) {
                logger.error({ err: error, channelId: args.channelId }, 'Failed to update channel');
                throw new GraphQLError(`Failed to update channel: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        deleteChannel: async (
            _: unknown,
            args: { channelId: string },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            let channel;
            try {
                channel = await context.client.channels.fetch(args.channelId);
            } catch (e) {
                // ignore
            }

             if (!channel || channel.isDMBased()) {
                 throw new GraphQLError('Channel not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const guild = channel.guild;
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found (in DB)', { extensions: { code: 'NOT_FOUND' } });
            
            // Destruction usually requires OWNER, but channel deletion is ADMIN/CONFIGURE usually.
            // PROJECT_STATUS says 'configure' is ADMIN. 'destroy' is OWNER.
            // Deleting a channel is configuration. Deleting the guild/bot-data is destruction.
            const level = await getUserAccessLevel(guild.id, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                await channel.delete();
                return true;
            } catch (error: any) {
                logger.error({ err: error, channelId: args.channelId }, 'Failed to delete channel');
                throw new GraphQLError(`Failed to delete channel: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        moveChannel: async (
            _: unknown,
            args: { channelId: string; position: number; parentId?: string },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            let channel;
            try {
                channel = await context.client.channels.fetch(args.channelId);
            } catch (e) {
                // ignore
            }

             if (!channel || channel.isDMBased()) {
                 throw new GraphQLError('Channel not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const guild = channel.guild;
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found (in DB)', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(guild.id, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                // If parentId is provided, we might be moving to a category
                const editData: any = {
                    position: args.position
                };
                if (args.parentId !== undefined) editData.parent = args.parentId;

                const updated = await channel.edit(editData);
                const updatedAny = updated as any;

                return {
                    id: updated.id,
                    name: updated.name,
                    type: mapChannelType(updated.type),
                    parentId: updated.parentId,
                    position: updatedAny.position ?? 0,
                    createdAt: updated.createdAt
                };
            } catch (error: any) {
                logger.error({ err: error, channelId: args.channelId }, 'Failed to move channel');
                throw new GraphQLError(`Failed to move channel: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        createCategory: async (
            _: unknown,
            args: { guildId: string; name: string; position?: number },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                const guild = await context.client.guilds.fetch(args.guildId);
                
                const createData: any = {
                    name: args.name,
                    type: DiscordChannelType.GuildCategory,
                };
                if (args.position !== undefined) createData.position = args.position;

                const category = await guild.channels.create(createData);

                return {
                    id: category.id,
                    name: category.name,
                    position: category.position,
                    channels: [],
                    createdAt: category.createdAt
                };
            } catch (error: any) {
                logger.error({ err: error, guildId: args.guildId }, 'Failed to create category');
                throw new GraphQLError(`Failed to create category: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        updateCategory: async (
            _: unknown,
            args: { categoryId: string; name?: string; position?: number },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            let channel;
            try {
                channel = await context.client.channels.fetch(args.categoryId);
            } catch (e) {
                // ignore
            }

            if (!channel || channel.isDMBased() || channel.type !== DiscordChannelType.GuildCategory) {
                throw new GraphQLError('Category not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const guild = channel.guild;
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found (in DB)', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(guild.id, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                const editData: any = {};
                if (args.name !== undefined) editData.name = args.name;
                if (args.position !== undefined) editData.position = args.position;

                const updated = await channel.edit(editData);

                // Fetch children for the channels field
                const allChannels = await guild.channels.fetch();
                const children = Array.from(allChannels.values())
                    .filter(c => c && c.parentId === updated.id)
                    .map(c => ({
                        id: c!.id,
                        name: c!.name,
                        type: mapChannelType(c!.type),
                        parentId: c!.parentId,
                        position: (c as any).position ?? 0,
                        createdAt: c!.createdAt
                    }))
                    .sort((a, b) => a.position - b.position);

                return {
                    id: updated.id,
                    name: updated.name,
                    position: updated.position,
                    channels: children,
                    createdAt: updated.createdAt
                };
            } catch (error: any) {
                logger.error({ err: error, categoryId: args.categoryId }, 'Failed to update category');
                throw new GraphQLError(`Failed to update category: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        deleteCategory: async (
            _: unknown,
            args: { categoryId: string },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            let channel;
            try {
                channel = await context.client.channels.fetch(args.categoryId);
            } catch (e) {
                // ignore
            }

            if (!channel || channel.isDMBased() || channel.type !== DiscordChannelType.GuildCategory) {
                throw new GraphQLError('Category not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const guild = channel.guild;
            const guildOwner = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found (in DB)', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(guild.id, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            try {
                await channel.delete();
                return true;
            } catch (error: any) {
                logger.error({ err: error, categoryId: args.categoryId }, 'Failed to delete category');
                throw new GraphQLError(`Failed to delete category: ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        updateSettings: async (
            _: unknown,
            args: { guildId: string; input: { systemChannelId?: string; timezone?: string; locale?: string } },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            const guild = await context.prisma.guild.findUnique({ where: { id: args.guildId } });
            
            const currentSettings = (guild?.settings as any) || {};
            // Filter out undefined and empty strings from input
            const inputCleaned = Object.fromEntries(
                Object.entries(args.input).filter(([_, v]) => v !== undefined)
            );
            
            const newSettings = { ...currentSettings, ...inputCleaned };

            return context.prisma.guild.update({
                where: { id: args.guildId },
                data: { settings: newSettings }
            });
        },

        updateLogConfig: async (
            _: unknown,
            args: { guildId: string; input: any },
            context: ApiContext
        ) => {
             if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

             const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
             if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

             const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
             if (!can.configure(level)) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

             // Remove undefined fields
             const data = Object.fromEntries(
                Object.entries(args.input).filter(([_, v]) => v !== undefined)
             );

             return context.prisma.logConfig.upsert({
                 where: { guildId: args.guildId },
                 create: { guildId: args.guildId, ...data },
                 update: { ...data }
             });
        },

        grantAccess: async (
            _: unknown,
            args: { guildId: string; input: { userId?: string; roleId?: string; level: AccessLevel } },
            context: ApiContext
        ) => {
            if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

            // Only OWNER can grant access (or maybe ADMIN? Code says OWNER in schema comments)
            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (level !== AccessLevel.OWNER) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            if (!args.input.userId && !args.input.roleId) {
                throw new GraphQLError('Must provide either userId or roleId', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // Clean input
             const data: any = {
                 guildId: args.guildId,
                 level: args.input.level,
                 grantedBy: context.userId
             };
             if (args.input.userId) data.userId = args.input.userId;
             if (args.input.roleId) data.roleId = args.input.roleId;

             // Logic to handle existing grants?
             // Upsert requires unique constraint.
             // guildId_userId is unique. guildId_roleId is NOT unique in schema?
             // If roleId, we used findFirst+update in previous direct-db attempt.
             
             if (args.input.roleId) {
                 const existing = await context.prisma.guildAccess.findFirst({
                     where: { guildId: args.guildId, roleId: args.input.roleId }
                 });
                 if (existing) {
                     return context.prisma.guildAccess.update({
                         where: { id: existing.id },
                         data: { level: args.input.level, grantedBy: context.userId }
                     });
                 }
             }

             if (args.input.userId) {
                  // Direct upsert possible for user
                  return context.prisma.guildAccess.upsert({
                      where: {
                          guildId_userId: {
                              guildId: args.guildId,
                              userId: args.input.userId
                          }
                      },
                      create: data,
                      update: { level: args.input.level, grantedBy: context.userId }
                  });
             }

             return context.prisma.guildAccess.create({ data });
        },

        revokeAccess: async (
            _: unknown,
            args: { guildId: string; userId?: string; roleId?: string },
            context: ApiContext
        ) => {
             if (!context.userId) throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });

            const guildOwner = await context.prisma.guild.findUnique({ where: { id: args.guildId }, select: { ownerId: true } });
            if (!guildOwner) throw new GraphQLError('Guild not found', { extensions: { code: 'NOT_FOUND' } });

            const level = await getUserAccessLevel(args.guildId, context.userId, [], guildOwner.ownerId);
            if (level !== AccessLevel.OWNER) throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });

            if (args.userId) {
                await context.prisma.guildAccess.deleteMany({
                    where: { guildId: args.guildId, userId: args.userId }
                });
                return true;
            }
            if (args.roleId) {
                await context.prisma.guildAccess.deleteMany({
                    where: { guildId: args.guildId, roleId: args.roleId }
                });
                return true;
            }
            
            return false;
        },
    },

    // Field resolvers
    Guild: {
        addons: async (guild: { id: string }, _: unknown, context: ApiContext) => {
            return context.prisma.guildAddon.findMany({
                where: { guildId: guild.id },
                include: {
                    guild: true,
                    addon: true,
                },
            });
        },

        logConfig: async (
            guild: { id: string },
            _: unknown,
            context: ApiContext
        ) => {
            return context.prisma.logConfig.findUnique({
                where: { guildId: guild.id },
            });
        },

        accessGrants: async (
            guild: { id: string },
            _: unknown,
            context: ApiContext
        ) => {
            return context.prisma.guildAccess.findMany({
                where: { guildId: guild.id },
            });
        },

        myAccessLevel: async (
            guild: { id: string; ownerId: string },
            _: unknown,
            context: ApiContext
        ): Promise<EffectiveAccessLevel> => {
            if (!context.userId) {
                return null;
            }
            return getUserAccessLevel(guild.id, context.userId, [], guild.ownerId);
        },

        channels: async (
            guild: { id: string },
            _: unknown,
            context: ApiContext
        ) => {
            // Reuse logic from guildChannels but we don't have args here.
            // We need to check permissions again?
            // Yes, field resolvers should check permissions or rely on parent.
            // But 'guild' object here might come from 'guilds' query which checked access to list guilds.
            // But maybe not 'view' access?
            // Let's check view access.
            if (!context.userId) return [];
            
            const guildData = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
            if (!guildData) return []; // Should not happen if guild exists

             const level = await getUserAccessLevel(guild.id, context.userId, [], guildData.ownerId);
             if (!can.view(level)) return [];

             try {
                const discordGuild = await context.client.guilds.fetch(guild.id);
                const channels = await discordGuild.channels.fetch();
                return channels
                    .filter(c => c && c.type !== DiscordChannelType.GuildCategory)
                    .map(c => ({
                        id: c!.id,
                        name: c!.name,
                        type: mapChannelType(c!.type),
                        parentId: c!.parentId,
                        position: c!.position,
                        createdAt: c!.createdAt
                    }))
                    .sort((a, b) => a.position - b.position);
             } catch (e) {
                 return [];
             }
        },

        categories: async (
            guild: { id: string },
            _: unknown,
            context: ApiContext
        ) => {
             if (!context.userId) return [];
            
             const guildData = await context.prisma.guild.findUnique({ where: { id: guild.id }, select: { ownerId: true } });
             if (!guildData) return [];

             const level = await getUserAccessLevel(guild.id, context.userId, [], guildData.ownerId);
             if (!can.view(level)) return [];

             try {
                const discordGuild = await context.client.guilds.fetch(guild.id);
                const channels = await discordGuild.channels.fetch();
                
                const allChannels = Array.from(channels.values());
                const categories = allChannels.filter(c => c && c.type === DiscordChannelType.GuildCategory);
                
                return categories.map(cat => {
                    const children = allChannels
                        .filter(c => c && c.parentId === cat!.id)
                        .map(c => ({
                            id: c!.id,
                            name: c!.name,
                            type: mapChannelType(c!.type),
                            parentId: c!.parentId,
                            position: c!.position,
                            createdAt: c!.createdAt
                        }))
                        .sort((a, b) => a.position - b.position);

                    return {
                        id: cat!.id,
                        name: cat!.name,
                        position: cat!.position,
                        channels: children,
                        createdAt: cat!.createdAt
                    };
                }).sort((a, b) => a.position - b.position);
             } catch (e) {
                 return [];
             }
        }
    },

    // Guild field resolvers
    Guild: {
        // Map Prisma iconHash to GraphQL icon
        icon: (guild: { iconHash?: string | null }) => guild.iconHash ?? null,
    },

    GuildAddon: {
        guild: async (
            guildAddon: { guildId: string },
            _: unknown,
            context: ApiContext
        ) => {
            return context.prisma.guild.findUnique({
                where: { id: guildAddon.guildId },
            });
        },

        addon: async (
            guildAddon: { addonId: string },
            _: unknown,
            context: ApiContext
        ) => {
            return context.prisma.addon.findUnique({
                where: { id: guildAddon.addonId },
            });
        },
    },
};
