/**
 * Permission Enforcer
 * Validates and enforces addon permission declarations
 */

import { createLogger } from '../logging/index.js';
import type { AddonManifest, AddonPermissions } from './types.js';

const logger = createLogger('addons:permissions');

/**
 * Allowed permission scopes that addons can request
 */
const ALLOWED_EVENTS = [
    'messageCreate',
    'messageUpdate',
    'messageDelete',
    'messageBulkDelete',
    'guildMemberAdd',
    'guildMemberRemove',
    'guildMemberUpdate',
    'guildBanAdd',
    'guildBanRemove',
    'interactionCreate',
    'voiceStateUpdate',
    'channelCreate',
    'channelUpdate',
    'channelDelete',
    'roleCreate',
    'roleUpdate',
    'roleDelete',
    'guildUpdate',
] as const;

/**
 * Enforces addon permission declarations
 */
export class PermissionEnforcer {
    /**
     * Validate addon manifest permissions
     */
    public validate(manifest: AddonManifest): void {
        const { permissions } = manifest;

        // Validate event permissions
        if (permissions.events) {
            for (const event of permissions.events) {
                if (!ALLOWED_EVENTS.includes(event as (typeof ALLOWED_EVENTS)[number])) {
                    throw new Error(
                        `Addon ${manifest.name} requests unknown event permission: ${event}`
                    );
                }
            }
        }

        // Log validated permissions
        logger.debug(
            {
                addonId: manifest.id,
                commands: permissions.commands?.length ?? 0,
                events: permissions.events?.length ?? 0,
                http: permissions.http?.length ?? 0,
                database: permissions.database ?? false,
                secrets: permissions.secrets ?? false,
            },
            'Addon permissions validated'
        );
    }

    /**
     * Check if an addon has permission for a specific action
     */
    public hasPermission(
        manifest: AddonManifest,
        type: keyof AddonPermissions,
        value?: string
    ): boolean {
        const permissions = manifest.permissions;

        switch (type) {
            case 'commands':
                return value
                    ? permissions.commands?.includes(value) ?? false
                    : (permissions.commands?.length ?? 0) > 0;

            case 'events':
                return value
                    ? permissions.events?.includes(value) ?? false
                    : (permissions.events?.length ?? 0) > 0;

            case 'http':
                return value
                    ? permissions.http?.includes(value) ?? false
                    : (permissions.http?.length ?? 0) > 0;

            case 'database':
                return permissions.database ?? false;

            case 'secrets':
                return permissions.secrets ?? false;

            default:
                return false;
        }
    }

    /**
     * Generate a human-readable permissions summary
     */
    public getSummary(manifest: AddonManifest): string[] {
        const summary: string[] = [];
        const { permissions } = manifest;

        if (permissions.commands?.length) {
            summary.push(`Commands: ${permissions.commands.join(', ')}`);
        }

        if (permissions.events?.length) {
            summary.push(`Events: ${permissions.events.join(', ')}`);
        }

        if (permissions.http?.length) {
            summary.push(`HTTP Routes: ${permissions.http.join(', ')}`);
        }

        if (permissions.database) {
            summary.push('Database: Read/Write access to addon-scoped data');
        }

        if (permissions.secrets) {
            summary.push('Secrets: Can store and retrieve encrypted secrets');
        }

        return summary;
    }
}
