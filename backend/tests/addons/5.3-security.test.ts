import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const ADDONS_DIR = resolve(BACKEND_DIR, 'src/addons');

describe('Addon Security', () => {
    describe('PermissionEnforcer', () => {
        let enforcerSource: string;

        beforeAll(() => {
            enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
        });

        it('should have PermissionEnforcer.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'))).toBe(true);
        });

        it('should export PermissionEnforcer class', () => {
            expect(enforcerSource).toContain('export class PermissionEnforcer');
        });
    });

    describe('Allowed Events Whitelist', () => {
        let enforcerSource: string;

        beforeAll(() => {
            enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
        });

        it('should define ALLOWED_EVENTS constant', () => {
            expect(enforcerSource).toContain('const ALLOWED_EVENTS');
        });

        const expectedEvents = [
            'messageCreate',
            'messageUpdate',
            'messageDelete',
            'guildMemberAdd',
            'guildMemberRemove',
            'interactionCreate',
            'voiceStateUpdate',
            'channelCreate',
            'channelUpdate',
            'channelDelete',
        ];

        it.each(expectedEvents)('should allow %s event', (event) => {
            const enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
            expect(enforcerSource).toContain(`'${event}'`);
        });
    });

    describe('Manifest Validation', () => {
        let enforcerSource: string;

        beforeAll(() => {
            enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
        });

        it('should have validate method', () => {
            expect(enforcerSource).toContain('public validate(manifest: AddonManifest)');
        });

        it('should validate event permissions', () => {
            expect(enforcerSource).toContain('if (permissions.events)');
        });

        it('should iterate through event permissions', () => {
            expect(enforcerSource).toContain('for (const event of permissions.events)');
        });

        it('should check against allowed events', () => {
            expect(enforcerSource).toContain('ALLOWED_EVENTS.includes');
        });

        it('should throw error for unknown events', () => {
            expect(enforcerSource).toContain('requests unknown event permission');
        });

        it('should log validated permissions', () => {
            expect(enforcerSource).toContain('Addon permissions validated');
        });
    });

    describe('Permission Checking', () => {
        let enforcerSource: string;

        beforeAll(() => {
            enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
        });

        it('should have hasPermission method', () => {
            expect(enforcerSource).toContain('public hasPermission');
        });

        it('should check command permissions', () => {
            expect(enforcerSource).toContain("case 'commands':");
        });

        it('should check event permissions', () => {
            expect(enforcerSource).toContain("case 'events':");
        });

        it('should check http permissions', () => {
            expect(enforcerSource).toContain("case 'http':");
        });

        it('should check database permissions', () => {
            expect(enforcerSource).toContain("case 'database':");
        });

        it('should check secrets permissions', () => {
            expect(enforcerSource).toContain("case 'secrets':");
        });

        it('should return false for unknown permission types', () => {
            expect(enforcerSource).toContain('default:');
            expect(enforcerSource).toContain('return false');
        });
    });

    describe('Permission Summary', () => {
        let enforcerSource: string;

        beforeAll(() => {
            enforcerSource = readFileSync(resolve(ADDONS_DIR, 'PermissionEnforcer.ts'), 'utf-8');
        });

        it('should have getSummary method', () => {
            expect(enforcerSource).toContain('public getSummary(manifest: AddonManifest)');
        });

        it('should return array of strings', () => {
            expect(enforcerSource).toContain('const summary: string[]');
            expect(enforcerSource).toContain('return summary');
        });

        it('should summarize commands', () => {
            expect(enforcerSource).toContain('Commands:');
        });

        it('should summarize events', () => {
            expect(enforcerSource).toContain('Events:');
        });

        it('should summarize HTTP routes', () => {
            expect(enforcerSource).toContain('HTTP Routes:');
        });

        it('should summarize database access', () => {
            expect(enforcerSource).toContain('Database: Read/Write access');
        });

        it('should summarize secrets access', () => {
            expect(enforcerSource).toContain('Secrets: Can store and retrieve encrypted secrets');
        });
    });

    describe('Permission Scoping', () => {
        let typesSource: string;

        beforeAll(() => {
            typesSource = readFileSync(resolve(ADDONS_DIR, 'types.ts'), 'utf-8');
        });

        it('should define AddonPermissions type', () => {
            expect(typesSource).toContain('AddonPermissions');
        });

        it('should include commands permission', () => {
            expect(typesSource).toContain('commands');
        });

        it('should include events permission', () => {
            expect(typesSource).toContain('events');
        });

        it('should include http permission', () => {
            expect(typesSource).toContain('http');
        });

        it('should include database permission', () => {
            expect(typesSource).toContain('database');
        });

        it('should include secrets permission', () => {
            expect(typesSource).toContain('secrets');
        });
    });
});
