import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Database Models', () => {
    let schema: string;

    beforeAll(() => {
        schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
    });

    describe('AccessLevel Enum', () => {
        it('should define AccessLevel enum', () => {
            expect(schema).toContain('enum AccessLevel');
        });

        it('should have ADMIN level', () => {
            expect(schema).toContain('ADMIN');
        });

        it('should have MODERATOR level', () => {
            expect(schema).toContain('MODERATOR');
        });

        it('should have VIEWER level', () => {
            expect(schema).toContain('VIEWER');
        });
    });

    describe('Guild Model', () => {
        it('should define Guild model', () => {
            expect(schema).toContain('model Guild');
        });

        it('should have id as primary key', () => {
            expect(schema).toMatch(/model Guild[\s\S]*?id\s+String\s+@id/);
        });

        it('should have name field', () => {
            expect(schema).toMatch(/model Guild[\s\S]*?name\s+String/);
        });

        it('should have ownerId field', () => {
            expect(schema).toMatch(/model Guild[\s\S]*?ownerId\s+String/);
        });

        it('should have settings JSON field', () => {
            expect(schema).toMatch(/model Guild[\s\S]*?settings\s+Json/);
        });

        it('should map to guilds table', () => {
            expect(schema).toMatch(/model Guild[\s\S]*?@@map\("guilds"\)/);
        });
    });

    describe('GuildAccess Model (RBAC)', () => {
        it('should define GuildAccess model', () => {
            expect(schema).toContain('model GuildAccess');
        });

        it('should have userId for direct grants', () => {
            expect(schema).toMatch(/model GuildAccess[\s\S]*?userId\s+String\?/);
        });

        it('should have roleId for role-based grants', () => {
            expect(schema).toMatch(/model GuildAccess[\s\S]*?roleId\s+String\?/);
        });

        it('should have level field with AccessLevel type', () => {
            expect(schema).toMatch(/model GuildAccess[\s\S]*?level\s+AccessLevel/);
        });

        it('should have grantedBy field', () => {
            expect(schema).toMatch(/model GuildAccess[\s\S]*?grantedBy\s+String/);
        });
    });

    describe('Addon Model', () => {
        it('should define Addon model', () => {
            expect(schema).toContain('model Addon');
        });

        it('should have manifest JSON field', () => {
            expect(schema).toMatch(/model Addon[\s\S]*?manifest\s+Json/);
        });

        it('should have version field', () => {
            expect(schema).toMatch(/model Addon[\s\S]*?version\s+String/);
        });
    });

    describe('GuildAddon Model', () => {
        it('should define GuildAddon model', () => {
            expect(schema).toContain('model GuildAddon');
        });

        it('should have enabled toggle', () => {
            expect(schema).toMatch(/model GuildAddon[\s\S]*?enabled\s+Boolean/);
        });

        it('should have config JSON field', () => {
            expect(schema).toMatch(/model GuildAddon[\s\S]*?config\s+Json/);
        });

        it('should have composite primary key', () => {
            expect(schema).toMatch(/model GuildAddon[\s\S]*?@@id\(\[guildId,\s*addonId\]\)/);
        });
    });

    describe('AuditLog Model', () => {
        it('should define AuditLog model', () => {
            expect(schema).toContain('model AuditLog');
        });

        it('should have action field', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?action\s+String/);
        });

        it('should have userId field', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?userId\s+String/);
        });

        it('should have ipAddress field for web actions', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?ipAddress\s+String\?/);
        });

        it('should have index on guildId and createdAt', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?@@index\(\[guildId,\s*createdAt\]\)/);
        });
    });

    describe('Session Model', () => {
        it('should define Session model', () => {
            expect(schema).toContain('model Session');
        });

        it('should have accessToken field', () => {
            expect(schema).toMatch(/model Session[\s\S]*?accessToken\s+String/);
        });

        it('should have refreshToken field', () => {
            expect(schema).toMatch(/model Session[\s\S]*?refreshToken\s+String/);
        });

        it('should have expiresAt field', () => {
            expect(schema).toMatch(/model Session[\s\S]*?expiresAt\s+DateTime/);
        });
    });

    describe('Secret Model', () => {
        it('should define Secret model', () => {
            expect(schema).toContain('model Secret');
        });

        it('should have key field', () => {
            expect(schema).toMatch(/model Secret[\s\S]*?key\s+String/);
        });

        it('should have encrypted value field', () => {
            expect(schema).toMatch(/model Secret[\s\S]*?value\s+String/);
        });

        it('should have unique constraint on guildId, addonId, key', () => {
            expect(schema).toMatch(/model Secret[\s\S]*?@@unique\(\[guildId,\s*addonId,\s*key\]\)/);
        });
    });

    describe('LogConfig Model', () => {
        it('should define LogConfig model', () => {
            expect(schema).toContain('model LogConfig');
        });

        it('should have modLogChannelId', () => {
            expect(schema).toMatch(/model LogConfig[\s\S]*?modLogChannelId\s+String\?/);
        });

        it('should have serverLogChannelId', () => {
            expect(schema).toMatch(/model LogConfig[\s\S]*?serverLogChannelId\s+String\?/);
        });

        it('should have feature toggles', () => {
            expect(schema).toMatch(/model LogConfig[\s\S]*?logMessages\s+Boolean/);
            expect(schema).toMatch(/model LogConfig[\s\S]*?logMembers\s+Boolean/);
            expect(schema).toMatch(/model LogConfig[\s\S]*?logVoice\s+Boolean/);
            expect(schema).toMatch(/model LogConfig[\s\S]*?logModeration\s+Boolean/);
        });

        it('should have unique guildId', () => {
            expect(schema).toMatch(/model LogConfig[\s\S]*?guildId\s+String\s+@unique/);
        });
    });
});
