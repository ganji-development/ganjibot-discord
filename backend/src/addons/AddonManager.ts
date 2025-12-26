/**
 * Addon Manager
 * Central orchestration of addon lifecycle
 */

import { createLogger } from '../logging/index.js';
import { prisma } from '../database/index.js';
import { AddonLoader } from './AddonLoader.js';
import { AddonRegistry } from './AddonRegistry.js';
import { PermissionEnforcer } from './PermissionEnforcer.js';
import type { LoadedAddon } from './types.js';

const logger = createLogger('addons:manager');

/**
 * Manages addon discovery, loading, and lifecycle
 */
export class AddonManager {
    private readonly loader: AddonLoader;
    private readonly registry: AddonRegistry;
    private readonly permissionEnforcer: PermissionEnforcer;
    private initialized = false;

    constructor() {
        this.loader = new AddonLoader();
        this.registry = new AddonRegistry();
        this.permissionEnforcer = new PermissionEnforcer();
    }

    /**
     * Initialize the addon manager
     * Loads installed addons from database
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            logger.warn('AddonManager already initialized');
            return;
        }

        logger.info('Initializing addon manager...');

        // Load installed addons from database
        try {
            const installedAddons = await prisma.addon.findMany();

            for (const dbAddon of installedAddons) {
                try {
                    // id is the package name
                    const addon = await this.loader.load(dbAddon.id);
                    this.registry.register(addon);

                    // Load guild-specific enabled states
                    const guildAddons = await prisma.guildAddon.findMany({
                        where: { addonId: dbAddon.id, enabled: true },
                    });

                    for (const ga of guildAddons) {
                        this.registry.enableForGuild(addon.id, ga.guildId);
                    }

                    logger.info({ name: addon.manifest.name }, 'Addon loaded from database');
                } catch (error) {
                    logger.error({ error, packageName: dbAddon.id }, 'Failed to load addon');
                }
            }
        } catch (error) {
            logger.error({ error }, 'Failed to load addons from database');
        }

        this.initialized = true;
        logger.info('Addon manager initialized');
    }

    /**
     * Install an addon from NPM
     */
    public async install(packageName: string): Promise<LoadedAddon> {
        logger.info({ packageName }, 'Installing addon');

        // Load the addon
        const addon = await this.loader.load(packageName);

        // Validate permissions
        this.permissionEnforcer.validate(addon.manifest);

        // Persist to database (id = packageName)
        await prisma.addon.upsert({
            where: { id: addon.id },
            create: {
                id: addon.id,
                name: addon.manifest.name,
                version: addon.manifest.version,
                description: addon.manifest.description,
                author: addon.manifest.author,
                manifest: JSON.parse(JSON.stringify(addon.manifest)),
            },
            update: {
                name: addon.manifest.name,
                version: addon.manifest.version,
                description: addon.manifest.description,
                author: addon.manifest.author,
                manifest: JSON.parse(JSON.stringify(addon.manifest)),
            },
        });

        // Register the addon
        this.registry.register(addon);

        // Call onInit lifecycle hook
        if (addon.instance.onInit) {
            await addon.instance.onInit();
        }

        logger.info({ packageName, name: addon.manifest.name }, 'Addon installed');
        return addon;
    }

    /**
     * Uninstall an addon
     */
    public async uninstall(addonId: string): Promise<void> {
        logger.info({ addonId }, 'Uninstalling addon');

        const addon = this.registry.get(addonId);
        if (!addon) {
            throw new Error(`Addon not found: ${addonId}`);
        }

        // Call onUnload lifecycle hook
        if (addon.instance.onUnload) {
            await addon.instance.onUnload();
        }

        // Remove all guild associations first (foreign key)
        await prisma.guildAddon.deleteMany({
            where: { addonId },
        });

        // Remove addon from database
        await prisma.addon.delete({
            where: { id: addonId },
        });

        // Unregister the addon
        this.registry.unregister(addonId);

        logger.info({ addonId }, 'Addon uninstalled');
    }

    /**
     * Enable an addon for a specific guild
     */
    public async enableForGuild(addonId: string, guildId: string): Promise<void> {
        logger.info({ addonId, guildId }, 'Enabling addon for guild');

        const addon = this.registry.get(addonId);
        if (!addon) {
            throw new Error(`Addon not found: ${addonId}`);
        }

        // Persist to database
        await prisma.guildAddon.upsert({
            where: { guildId_addonId: { guildId, addonId } },
            create: { guildId, addonId, enabled: true },
            update: { enabled: true },
        });

        // Call onEnable lifecycle hook
        if (addon.instance.onEnable) {
            await addon.instance.onEnable(guildId);
        }

        // Update registry
        this.registry.enableForGuild(addonId, guildId);

        logger.info({ addonId, guildId }, 'Addon enabled for guild');
    }

    /**
     * Disable an addon for a specific guild
     */
    public async disableForGuild(
        addonId: string,
        guildId: string
    ): Promise<void> {
        logger.info({ addonId, guildId }, 'Disabling addon for guild');

        const addon = this.registry.get(addonId);
        if (!addon) {
            throw new Error(`Addon not found: ${addonId}`);
        }

        // Persist to database
        await prisma.guildAddon.update({
            where: { guildId_addonId: { guildId, addonId } },
            data: { enabled: false },
        });

        // Call onDisable lifecycle hook
        if (addon.instance.onDisable) {
            await addon.instance.onDisable(guildId);
        }

        // Update registry
        this.registry.disableForGuild(addonId, guildId);

        logger.info({ addonId, guildId }, 'Addon disabled for guild');
    }

    /**
     * Get all loaded addons
     */
    public getAll(): LoadedAddon[] {
        return this.registry.getAll();
    }

    /**
     * Get a specific addon
     */
    public get(addonId: string): LoadedAddon | undefined {
        return this.registry.get(addonId);
    }

    /**
     * Check if an addon is enabled for a guild
     */
    public isEnabledForGuild(addonId: string, guildId: string): boolean {
        return this.registry.isEnabledForGuild(addonId, guildId);
    }

    /**
     * Get the addon registry (for event/command registration)
     */
    public getRegistry(): AddonRegistry {
        return this.registry;
    }
}

