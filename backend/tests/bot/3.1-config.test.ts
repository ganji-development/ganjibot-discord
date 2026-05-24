import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Configuration Module', () => {
    describe('File Structure', () => {
        it('should have config module', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/config/index.ts'))).toBe(true);
        });
    });

    describe('Configuration Contents', () => {
        let configSource: string;

        beforeEach(() => {
            configSource = readFileSync(resolve(BACKEND_DIR, 'src/config/index.ts'), 'utf-8');
        });

        it('should use Zod for validation', () => {
            expect(configSource).toContain("import { z } from 'zod'");
        });

        it('should define configSchema with Zod', () => {
            expect(configSource).toContain('const configSchema = z.object');
        });

        it('should export Config type', () => {
            expect(configSource).toContain('export type Config');
        });

        it('should export loadConfig function', () => {
            expect(configSource).toContain('function loadConfig');
        });

        it('should export config instance', () => {
            expect(configSource).toContain('export const config');
        });

        describe('Required Configuration Sections', () => {
            it('should have discord config section', () => {
                expect(configSource).toContain('discord: z.object');
            });

            it('should require DISCORD_TOKEN', () => {
                expect(configSource).toContain('DISCORD_TOKEN');
            });

            it('should require DISCORD_CLIENT_ID', () => {
                expect(configSource).toContain('DISCORD_CLIENT_ID');
            });

            it('should have database config section', () => {
                expect(configSource).toContain('database: z.object');
            });

            it('should have api config section', () => {
                expect(configSource).toContain('api: z.object');
            });

            it('should have jwt config section', () => {
                expect(configSource).toContain('jwt: z.object');
            });

            it('should require JWT_SECRET minimum length', () => {
                expect(configSource).toMatch(/JWT_SECRET.*32/);
            });

            it('should have logging config section', () => {
                expect(configSource).toContain('logging: z.object');
            });

            it('should have addons config section', () => {
                expect(configSource).toContain('addons: z.object');
            });
        });
    });
});

describe('Logging Module', () => {
    describe('File Structure', () => {
        it('should have logging module', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/logging/index.ts'))).toBe(true);
        });
    });

    describe('Logging Contents', () => {
        let loggingSource: string;

        beforeEach(() => {
            loggingSource = readFileSync(resolve(BACKEND_DIR, 'src/logging/index.ts'), 'utf-8');
        });

        it('should use Pino logger', () => {
            expect(loggingSource).toContain("from 'pino'");
        });

        it('should export createLogger function', () => {
            expect(loggingSource).toContain('export function createLogger');
        });
    });
});

describe('Main Entry Point', () => {
    it('should have main entry point', () => {
        expect(existsSync(resolve(BACKEND_DIR, 'src/index.ts'))).toBe(true);
    });

    describe('Entry Point Contents', () => {
        let indexSource: string;

        beforeEach(() => {
            indexSource = readFileSync(resolve(BACKEND_DIR, 'src/index.ts'), 'utf-8');
        });

        it('should import config', () => {
            expect(indexSource).toContain("from './config/index.js'");
        });

        it('should import database', () => {
            expect(indexSource).toContain("from './database/index.js'");
        });

        it('should import bot client', () => {
            expect(indexSource).toContain("from './bot/index.js'");
        });

        it('should import API server', () => {
            expect(indexSource).toContain("from './api/index.js'");
        });
    });
});
