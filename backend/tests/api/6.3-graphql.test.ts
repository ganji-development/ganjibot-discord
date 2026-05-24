import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const GRAPHQL_DIR = resolve(BACKEND_DIR, 'src/api/graphql');

describe('GraphQL', () => {
    describe('File Structure', () => {
        it('should have GraphQL directory', () => {
            expect(existsSync(GRAPHQL_DIR)).toBe(true);
        });

        it('should have schema.ts', () => {
            expect(existsSync(resolve(GRAPHQL_DIR, 'schema.ts'))).toBe(true);
        });

        it('should have resolvers.ts', () => {
            expect(existsSync(resolve(GRAPHQL_DIR, 'resolvers.ts'))).toBe(true);
        });
    });

    describe('Schema Definition', () => {
        let schemaSource: string;

        beforeAll(() => {
            schemaSource = readFileSync(resolve(GRAPHQL_DIR, 'schema.ts'), 'utf-8');
        });

        it('should export typeDefs', () => {
            expect(schemaSource).toContain('export const typeDefs');
        });

        it('should define Query type', () => {
            expect(schemaSource).toContain('type Query');
        });

        it('should define Mutation type', () => {
            expect(schemaSource).toContain('type Mutation');
        });

        it('should define User type', () => {
            expect(schemaSource).toContain('type User');
        });

        it('should define Guild type', () => {
            expect(schemaSource).toContain('type Guild');
        });

        it('should define Addon type', () => {
            expect(schemaSource).toContain('type Addon');
        });
    });

    describe('Resolvers', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should export resolvers object', () => {
            expect(resolversSource).toContain('export const resolvers');
        });

        it('should have Query resolvers', () => {
            expect(resolversSource).toContain('Query: {');
        });

        it('should have Mutation resolvers', () => {
            expect(resolversSource).toContain('Mutation: {');
        });
    });

    describe('Query.me', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should implement me resolver', () => {
            expect(resolversSource).toContain('me: async');
        });

        it('should check for userId in context', () => {
            expect(resolversSource).toContain('context.userId');
        });
    });

    describe('Query.guilds', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should implement guilds resolver', () => {
            expect(resolversSource).toContain('guilds: async');
        });
    });

    describe('Query.addons', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should implement addons resolver', () => {
            expect(resolversSource).toContain('addons: async');
        });

        it('should use addonManager from context', () => {
            expect(resolversSource).toContain('addonManager');
        });
    });

    describe('Mutation.enableAddon', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should implement enableAddon mutation', () => {
            expect(resolversSource).toContain('enableAddon');
        });

        it('should take guildId argument', () => {
            expect(resolversSource).toContain('guildId');
        });

        it('should take addonId argument', () => {
            expect(resolversSource).toContain('addonId');
        });
    });

    describe('Mutation.grantAccess', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should implement grantAccess mutation', () => {
            expect(resolversSource).toContain('grantAccess');
        });

        it('should support userId for direct grants', () => {
            expect(resolversSource).toContain('userId');
        });

        it('should support roleId for role-based grants', () => {
            expect(resolversSource).toContain('roleId');
        });

        it('should take level argument', () => {
            expect(resolversSource).toContain('level');
        });
    });

    describe('Access Control Integration', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should import access control functions', () => {
            expect(resolversSource).toContain("from '../middleware/accessControl.js'");
        });

        it('should use getUserAccessLevel', () => {
            expect(resolversSource).toContain('getUserAccessLevel');
        });

        it('should check requester access level for mutations', () => {
            // Resolvers use `can.configure()`, `can.moderate()`, etc. for access checks
            expect(resolversSource).toContain('can.');
        });
    });

    describe('Field Resolvers', () => {
        let resolversSource: string;

        beforeAll(() => {
            resolversSource = readFileSync(resolve(GRAPHQL_DIR, 'resolvers.ts'), 'utf-8');
        });

        it('should have Guild field resolvers', () => {
            expect(resolversSource).toContain('Guild: {');
        });

        it('should resolve Guild.addons', () => {
            expect(resolversSource).toContain('addons: async');
        });

        it('should resolve Guild.myAccessLevel', () => {
            expect(resolversSource).toContain('myAccessLevel');
        });

        it('should have GuildAddon field resolvers', () => {
            expect(resolversSource).toContain('GuildAddon: {');
        });
    });
});
