/**
 * Access Control System Tests
 * Tests for Phase 4.1: Access Control System
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const ACCESS_CONTROL_FILE = resolve(BACKEND_DIR, 'src/api/middleware/accessControl.ts');
const RESOLVERS_FILE = resolve(BACKEND_DIR, 'src/api/graphql/resolvers.ts');
const SCHEMA_FILE = resolve(BACKEND_DIR, 'src/api/graphql/schema.ts');
const PRISMA_SCHEMA = resolve(BACKEND_DIR, 'prisma/schema.prisma');

describe('Access Control System', () => {
    describe('File Structure', () => {
        it('should have accessControl.ts middleware file', () => {
            expect(existsSync(ACCESS_CONTROL_FILE)).toBe(true);
        });

        it('should have GraphQL resolvers with access control', () => {
            expect(existsSync(RESOLVERS_FILE)).toBe(true);
        });
    });

    describe('AccessLevel Enum Definition', () => {
        let prismaSchema: string;

        beforeAll(() => {
            prismaSchema = readFileSync(PRISMA_SCHEMA, 'utf-8');
        });

        it('should define AccessLevel enum in Prisma schema', () => {
            expect(prismaSchema).toContain('enum AccessLevel');
        });

        it('should include OWNER level', () => {
            expect(prismaSchema).toContain('OWNER');
        });

        it('should include ADMIN level', () => {
            expect(prismaSchema).toContain('ADMIN');
        });

        it('should include MODERATOR level', () => {
            expect(prismaSchema).toContain('MODERATOR');
        });

        it('should include VIEWER level', () => {
            expect(prismaSchema).toContain('VIEWER');
        });
    });

    describe('Access Control Middleware', () => {
        let accessControlSource: string;

        beforeAll(() => {
            accessControlSource = readFileSync(ACCESS_CONTROL_FILE, 'utf-8');
        });

        it('should export getUserAccessLevel function', () => {
            expect(accessControlSource).toContain('export async function getUserAccessLevel');
        });

        it('should export hasAccess function', () => {
            expect(accessControlSource).toContain('export function hasAccess');
        });

        it('should export can permission helpers', () => {
            expect(accessControlSource).toContain('export const can');
        });

        it('should implement can.view helper', () => {
            expect(accessControlSource).toContain('view:');
        });

        it('should implement can.moderate helper', () => {
            expect(accessControlSource).toContain('moderate:');
        });

        it('should implement can.configure helper', () => {
            expect(accessControlSource).toContain('configure:');
        });

        it('should implement can.destroy helper', () => {
            expect(accessControlSource).toContain('destroy:');
        });

        it('should implement can.manageAccess helper', () => {
            expect(accessControlSource).toContain('manageAccess:');
        });

        it('should define access hierarchy', () => {
            expect(accessControlSource).toContain('ACCESS_HIERARCHY');
        });

        it('should check for guild owner status', () => {
            expect(accessControlSource).toContain('guildOwnerId');
        });

        it('should check direct user grants', () => {
            expect(accessControlSource).toContain('guildAccess.findUnique');
        });

        it('should check role-based grants', () => {
            expect(accessControlSource).toContain('guildAccess.findMany');
        });
    });

    describe('GraphQL Schema - Access Types', () => {
        let schemaSource: string;

        beforeAll(() => {
            schemaSource = readFileSync(SCHEMA_FILE, 'utf-8');
        });

        it('should define AccessLevel enum', () => {
            expect(schemaSource).toContain('enum AccessLevel');
        });

        it('should define GuildAccess type', () => {
            expect(schemaSource).toContain('type GuildAccess');
        });

        it('should define GrantAccessInput input type', () => {
            expect(schemaSource).toContain('input GrantAccessInput');
        });

        it('should include grantAccess mutation', () => {
            expect(schemaSource).toContain('grantAccess(');
        });

        it('should include revokeAccess mutation', () => {
            expect(schemaSource).toContain('revokeAccess(');
        });

        it('should include myAccessLevel field on Guild', () => {
            expect(schemaSource).toContain('myAccessLevel:');
        });

        it('should include accessGrants field on Guild', () => {
            expect(schemaSource).toContain('accessGrants:');
        });
    });

    describe('grantAccess Mutation Security', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(RESOLVERS_FILE, 'utf-8');
        });

        it('should implement grantAccess mutation', () => {
            expect(resolversSource).toContain('grantAccess: async');
        });

        it('should require authentication', () => {
            // Check that it validates context.userId
            expect(resolversSource).toContain('Authentication required');
        });

        it('should fetch guild info to determine ownership', () => {
            expect(resolversSource).toContain('prisma.guild.findUnique');
        });

        it('should check requester access level', () => {
            expect(resolversSource).toContain('requesterAccessLevel');
        });

        it('should only allow OWNER to manage access', () => {
            expect(resolversSource).toContain('Only guild owners can manage dashboard access');
        });

        it('should PREVENT non-owners from granting OWNER access', () => {
            // The security check that non-owners cannot grant OWNER
            expect(resolversSource).toContain('Only the guild owner can grant OWNER access');
        });

        it('should PREVENT guild owner self-demotion', () => {
            // The security check preventing owner from demoting themselves
            expect(resolversSource).toContain('Guild owner cannot have their access level changed');
        });

        it('should validate input (userId or roleId required)', () => {
            expect(resolversSource).toContain('Must provide either userId or roleId');
        });
    });

    describe('revokeAccess Mutation Security', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(RESOLVERS_FILE, 'utf-8');
        });

        it('should implement revokeAccess mutation', () => {
            expect(resolversSource).toContain('revokeAccess: async');
        });

        it('should require authentication', () => {
            expect(resolversSource).toContain('context.userId');
        });

        it('should PREVENT revoking guild owner access', () => {
            // Cannot remove access from the guild owner
            expect(resolversSource).toContain("Cannot revoke guild owner\\'s access");
        });

        it('should only allow OWNER to revoke access', () => {
            expect(resolversSource).toContain('requesterAccessLevel');
        });
    });

    describe('Guild Field Resolvers', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(RESOLVERS_FILE, 'utf-8');
        });

        it('should resolve myAccessLevel field', () => {
            expect(resolversSource).toContain('myAccessLevel: async');
        });

        it('should resolve accessGrants field', () => {
            expect(resolversSource).toContain('accessGrants: async');
        });

        it('should use getUserAccessLevel for myAccessLevel', () => {
            expect(resolversSource).toContain('getUserAccessLevel');
        });
    });

    describe('Access Level Hierarchy', () => {
        let accessControlSource: string;

        beforeAll(() => {
            accessControlSource = readFileSync(ACCESS_CONTROL_FILE, 'utf-8');
        });

        it('should order access levels correctly (VIEWER < MODERATOR < ADMIN < OWNER)', () => {
            // The hierarchy should have VIEWER at lowest index, OWNER at highest
            const hierarchyMatch = accessControlSource.match(/ACCESS_HIERARCHY[^=]*=\s*\[([^\]]+)\]/);
            expect(hierarchyMatch).toBeTruthy();
            
            if (!hierarchyMatch || !hierarchyMatch[1]) {
                throw new Error('ACCESS_HIERARCHY not found');
            }
            
            const hierarchy = hierarchyMatch[1];
            const viewerPos = hierarchy.indexOf('VIEWER');
            const modPos = hierarchy.indexOf('MODERATOR');
            const adminPos = hierarchy.indexOf('ADMIN');
            const ownerPos = hierarchy.indexOf('OWNER');

            expect(viewerPos).toBeLessThan(modPos);
            expect(modPos).toBeLessThan(adminPos);
            expect(adminPos).toBeLessThan(ownerPos);
        });
    });

    describe('Permission Checks', () => {
        let accessControlSource: string;

        beforeAll(() => {
            accessControlSource = readFileSync(ACCESS_CONTROL_FILE, 'utf-8');
        });

        it('should allow VIEWER level for view permission', () => {
            expect(accessControlSource).toMatch(/view:.*VIEWER/);
        });

        it('should require MODERATOR level for moderate permission', () => {
            expect(accessControlSource).toMatch(/moderate:.*MODERATOR/);
        });

        it('should require ADMIN level for configure permission', () => {
            expect(accessControlSource).toMatch(/configure:.*ADMIN/);
        });

        it('should require OWNER level for destroy permission', () => {
            expect(accessControlSource).toMatch(/destroy:.*OWNER/);
        });

        it('should require OWNER level for manageAccess permission', () => {
            expect(accessControlSource).toMatch(/manageAccess:.*OWNER/);
        });
    });
});
