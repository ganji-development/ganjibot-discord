/**
 * Access Control Service
 * Determines user access level for guild dashboard
 */

import { prisma } from '../../database/index.js';
import { createLogger } from '../../logging/index.js';
import type { AccessLevel } from '../../generated/prisma/client.js';

const logger = createLogger('api:access-control');

// Access level hierarchy (higher index = more permissions)
const ACCESS_HIERARCHY: readonly string[] = ['VIEWER', 'MODERATOR', 'ADMIN', 'OWNER'] as const;

export type EffectiveAccessLevel = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'VIEWER' | null;

/**
 * Get the effective access level for a user in a guild
 * 
 * @param guildId - Discord guild ID
 * @param userId - Discord user ID
 * @param userRoleIds - User's Discord role IDs in the guild (optional, for role-based access)
 * @param guildOwnerId - The guild owner's Discord ID
 * @returns The highest access level the user has, or null if no access
 */
export async function getUserAccessLevel(
    guildId: string,
    userId: string,
    userRoleIds: string[] = [],
    guildOwnerId?: string
): Promise<EffectiveAccessLevel> {
    // Check 1: Is user the guild owner?
    if (guildOwnerId && userId === guildOwnerId) {
        return 'OWNER';
    }

    // Check 2: If we don't have owner info, fetch the guild
    if (!guildOwnerId) {
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            select: { ownerId: true },
        });

        if (guild && userId === guild.ownerId) {
            return 'OWNER';
        }
    }

    try {
        // Check 3: Direct user grant
        const userGrant = await prisma.guildAccess.findUnique({
            where: {
                guildId_userId: {
                    guildId,
                    userId,
                },
            },
            select: { level: true },
        });

        // Check 4: Role-based grants
        let highestRoleLevel: AccessLevel | null = null;

        if (userRoleIds.length > 0) {
            const roleGrants = await prisma.guildAccess.findMany({
                where: {
                    guildId,
                    roleId: { in: userRoleIds },
                },
                select: { level: true },
            });

            for (const grant of roleGrants) {
                if (!highestRoleLevel ||
                    ACCESS_HIERARCHY.indexOf(grant.level) > ACCESS_HIERARCHY.indexOf(highestRoleLevel)) {
                    highestRoleLevel = grant.level;
                }
            }
        }

        // Return highest of user grant vs role grant
        const userLevel = userGrant?.level ?? null;

        if (userLevel && highestRoleLevel) {
            return ACCESS_HIERARCHY.indexOf(userLevel) >= ACCESS_HIERARCHY.indexOf(highestRoleLevel)
                ? userLevel
                : highestRoleLevel;
        }

        return userLevel ?? highestRoleLevel ?? null;
    } catch (error) {
        logger.error({ error, guildId, userId }, 'Error checking access level');
        return null;
    }
}

/**
 * Check if user has at least the required access level
 */
export function hasAccess(
    userLevel: EffectiveAccessLevel,
    requiredLevel: EffectiveAccessLevel
): boolean {
    if (!userLevel || !requiredLevel) return false;
    return ACCESS_HIERARCHY.indexOf(userLevel) >= ACCESS_HIERARCHY.indexOf(requiredLevel);
}

/**
 * Permission check helpers
 */
export const can = {
    view: (level: EffectiveAccessLevel) => hasAccess(level, 'VIEWER'),
    moderate: (level: EffectiveAccessLevel) => hasAccess(level, 'MODERATOR'),
    configure: (level: EffectiveAccessLevel) => hasAccess(level, 'ADMIN'),
    destroy: (level: EffectiveAccessLevel) => level === 'OWNER',
    manageAccess: (level: EffectiveAccessLevel) => level === 'OWNER',
};
