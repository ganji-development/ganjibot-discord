/**
 * GraphQL Resolvers
 */

import { createLogger } from '../../logging/index.js';
import type { ApiContext } from '../server.js';

const logger = createLogger('api:graphql');

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
                    logConfigs: true,
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
                data: { config: args.config },
                include: {
                    guild: true,
                    addon: true,
                },
            });
        },

        updateGuildSettings: async (
            _: unknown,
            args: { id: string; settings: Record<string, unknown> },
            context: ApiContext
        ) => {
            return context.prisma.guild.update({
                where: { id: args.id },
                data: { settings: args.settings },
            });
        },

        updateLogConfig: async (
            _: unknown,
            args: {
                guildId: string;
                logType: string;
                config: {
                    channelId: string;
                    enabled?: boolean;
                    filters?: Record<string, unknown>;
                    format?: Record<string, unknown>;
                };
            },
            context: ApiContext
        ) => {
            return context.prisma.logConfig.upsert({
                where: {
                    guildId_logType: {
                        guildId: args.guildId,
                        logType: args.logType as any,
                    },
                },
                create: {
                    guildId: args.guildId,
                    logType: args.logType as any,
                    channelId: args.config.channelId,
                    enabled: args.config.enabled ?? true,
                    filters: args.config.filters ?? {},
                    format: args.config.format ?? {},
                },
                update: {
                    channelId: args.config.channelId,
                    enabled: args.config.enabled,
                    filters: args.config.filters,
                    format: args.config.format,
                },
            });
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

        logConfigs: async (
            guild: { id: string },
            _: unknown,
            context: ApiContext
        ) => {
            return context.prisma.logConfig.findMany({
                where: { guildId: guild.id },
            });
        },
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
