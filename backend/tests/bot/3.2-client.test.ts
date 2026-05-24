import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Bot Client', () => {
    let clientSource: string;

    beforeAll(() => {
        clientSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/Client.ts'), 'utf-8');
    });

    describe('File Structure', () => {
        it('should have Client.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/bot/Client.ts'))).toBe(true);
        });
    });

    describe('Discord.js Integration', () => {
        it('should import Discord.js Client', () => {
            expect(clientSource).toContain("from 'discord.js'");
        });

        it('should import GatewayIntentBits', () => {
            expect(clientSource).toContain('GatewayIntentBits');
        });
    });

    describe('GanjibotClient Class', () => {
        it('should export GanjibotClient class', () => {
            expect(clientSource).toContain('export class GanjibotClient');
        });

        it('should have eventDispatcher property', () => {
            expect(clientSource).toContain('eventDispatcher');
        });

        it('should have commandHandler property', () => {
            expect(clientSource).toContain('commandHandler');
        });

        it('should have addonManager property', () => {
            expect(clientSource).toContain('addonManager');
        });
    });

    describe('Guild Sync', () => {
        it('should implement syncGuildToDatabase method', () => {
            expect(clientSource).toContain('syncGuildToDatabase');
        });

        it('should implement syncAllGuilds method', () => {
            expect(clientSource).toContain('syncAllGuilds');
        });

        it('should sync guilds on ready event', () => {
            expect(clientSource).toContain("'ready'");
        });
    });

    describe('Core Commands', () => {
        it('should register core commands', () => {
            expect(clientSource).toContain('registerCoreCommands');
        });
    });

    describe('Factory Function', () => {
        it('should export createClient factory', () => {
            expect(clientSource).toContain('export function createClient');
        });
    });
});
