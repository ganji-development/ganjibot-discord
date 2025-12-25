/**
 * Addon Loader
 * Loads addon packages from NPM or local filesystem
 */

import { createLogger } from '../logging/index.js';
import type { Addon, AddonManifest, LoadedAddon } from './types.js';

const logger = createLogger('addons:loader');

/**
 * Loads addon packages dynamically
 */
export class AddonLoader {
    /**
     * Load an addon from an NPM package or local path
     */
    public async load(packageNameOrPath: string): Promise<LoadedAddon> {
        logger.debug({ packageNameOrPath }, 'Loading addon');

        try {
            // Dynamic import the addon module
            const module = await import(packageNameOrPath);

            // Get the default export (addon class or factory)
            const AddonClass = module.default;

            if (!AddonClass) {
                throw new Error(
                    `Addon package ${packageNameOrPath} has no default export`
                );
            }

            // Instantiate the addon
            const instance: Addon =
                typeof AddonClass === 'function' ? new AddonClass() : AddonClass;

            // Validate required properties
            this.validateAddon(instance, packageNameOrPath);

            // Build manifest from addon properties
            const manifest = this.buildManifest(instance, packageNameOrPath);

            logger.info(
                { id: manifest.id, name: manifest.name, version: manifest.version },
                'Addon loaded'
            );

            return {
                id: manifest.id,
                instance,
                manifest,
            };
        } catch (error) {
            logger.error({ error, packageNameOrPath }, 'Failed to load addon');
            throw error;
        }
    }

    /**
     * Validate an addon instance has required properties
     */
    private validateAddon(addon: Addon, packageName: string): void {
        const required = ['name', 'version', 'author', 'description'] as const;

        for (const prop of required) {
            if (!addon[prop]) {
                throw new Error(
                    `Addon ${packageName} missing required property: ${prop}`
                );
            }
        }
    }

    /**
     * Build a manifest from addon properties
     */
    private buildManifest(addon: Addon, packageName: string): AddonManifest {
        return {
            id: packageName,
            name: addon.name,
            version: addon.version,
            author: addon.author,
            description: addon.description,
            permissions: addon.permissions ?? {},
            commands: addon.commands?.() ?? [],
            eventListeners: addon.eventListeners?.() ?? [],
            httpRoutes: addon.httpRoutes?.() ?? [],
        };
    }
}
