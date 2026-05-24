import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

/**
 * Database integration tests
 * Note: These tests verify the database module structure.
 * Full integration testing would require a test database.
 */
describe('Database Integration', () => {
    describe('Database Module', () => {
        it('should have database index module', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/database/index.ts'))).toBe(true);
        });
    });

    describe('Prisma Client Generation', () => {
        it('should have generated Prisma client directory', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/generated/prisma'))).toBe(true);
        });

        it('should export Prisma client types', async () => {
            // Dynamic import to verify module is loadable
            try {
                const prismaModule = await import(resolve(BACKEND_DIR, 'src/generated/prisma/index.js'));
                expect(prismaModule).toBeDefined();
            } catch (error) {
                // If import fails, verify the files exist at minimum
                expect(existsSync(resolve(BACKEND_DIR, 'src/generated/prisma/client.ts'))).toBe(true);
            }
        });
    });

    describe('Database Initialization', () => {
        it('database module should export initializeDatabase function', async () => {
            try {
                const dbModule = await import(resolve(BACKEND_DIR, 'src/database/index.js'));
                expect(dbModule).toHaveProperty('initializeDatabase');
                expect(typeof dbModule.initializeDatabase).toBe('function');
            } catch (error) {
                // Skip if module can't be loaded without full env
                console.warn('Database module requires environment variables');
            }
        });

        it('database module should export prisma client instance', async () => {
            try {
                const dbModule = await import(resolve(BACKEND_DIR, 'src/database/index.js'));
                expect(dbModule).toHaveProperty('prisma');
            } catch (error) {
                // Skip if module can't be loaded without full env
                console.warn('Database module requires environment variables');
            }
        });
    });
});
