/**
 * Addon Registry
 * Tracks loaded addons and their registrations
 */

import { createLogger } from '../logging/index.js';
import type { LoadedAddon } from './types.js';

const logger = createLogger('addons:registry');

/**
 * Registry of loaded addons and their guild states
 */
export class AddonRegistry {
    private readonly addons: Map<string, LoadedAddon> = new Map();
    private readonly guildStates: Map<string, Set<string>> = new Map(); // guildId -> Set<addonId>

    /**
     * Register a loaded addon
     */
    public register(addon: LoadedAddon): void {
        if (this.addons.has(addon.id)) {
            logger.warn({ addonId: addon.id }, 'Addon already registered, replacing');
        }

        this.addons.set(addon.id, addon);
        logger.debug({ addonId: addon.id, name: addon.manifest.name }, 'Addon registered');
    }

    /**
     * Unregister an addon
     */
    public unregister(addonId: string): void {
        const addon = this.addons.get(addonId);
        if (!addon) {
            logger.warn({ addonId }, 'Attempted to unregister unknown addon');
            return;
        }

        // Remove from all guilds
        for (const [guildId, enabledAddons] of this.guildStates.entries()) {
            if (enabledAddons.has(addonId)) {
                enabledAddons.delete(addonId);
                logger.debug({ addonId, guildId }, 'Removed addon from guild');
            }
        }

        this.addons.delete(addonId);
        logger.debug({ addonId }, 'Addon unregistered');
    }

    /**
     * Get a loaded addon by ID
     */
    public get(addonId: string): LoadedAddon | undefined {
        return this.addons.get(addonId);
    }

    /**
     * Get all loaded addons
     */
    public getAll(): LoadedAddon[] {
        return Array.from(this.addons.values());
    }

    /**
     * Enable an addon for a guild
     */
    public enableForGuild(addonId: string, guildId: string): void {
        if (!this.guildStates.has(guildId)) {
            this.guildStates.set(guildId, new Set());
        }

        this.guildStates.get(guildId)!.add(addonId);
    }

    /**
     * Disable an addon for a guild
     */
    public disableForGuild(addonId: string, guildId: string): void {
        this.guildStates.get(guildId)?.delete(addonId);
    }

    /**
     * Check if an addon is enabled for a guild
     */
    public isEnabledForGuild(addonId: string, guildId: string): boolean {
        return this.guildStates.get(guildId)?.has(addonId) ?? false;
    }

    /**
     * Get all enabled addons for a guild
     */
    public getEnabledForGuild(guildId: string): LoadedAddon[] {
        const enabledIds = this.guildStates.get(guildId);
        if (!enabledIds) return [];

        return Array.from(enabledIds)
            .map((id) => this.addons.get(id))
            .filter((addon): addon is LoadedAddon => addon !== undefined);
    }

    /**
     * Get all guilds where an addon is enabled
     */
    public getGuildsForAddon(addonId: string): string[] {
        const guilds: string[] = [];

        for (const [guildId, enabledAddons] of this.guildStates.entries()) {
            if (enabledAddons.has(addonId)) {
                guilds.push(guildId);
            }
        }

        return guilds;
    }
}
