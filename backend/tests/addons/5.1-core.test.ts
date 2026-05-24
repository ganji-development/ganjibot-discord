import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const ADDONS_DIR = resolve(BACKEND_DIR, 'src/addons');

describe('Addon Core Systems', () => {
    describe('File Structure', () => {
        it('should have addons directory', () => {
            expect(existsSync(ADDONS_DIR)).toBe(true);
        });

        it('should have index.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'index.ts'))).toBe(true);
        });

        it('should have types.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'types.ts'))).toBe(true);
        });

        it('should have AddonLoader.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'AddonLoader.ts'))).toBe(true);
        });

        it('should have AddonRegistry.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'AddonRegistry.ts'))).toBe(true);
        });

        it('should have AddonManager.ts', () => {
            expect(existsSync(resolve(ADDONS_DIR, 'AddonManager.ts'))).toBe(true);
        });
    });

    describe('AddonLoader', () => {
        let loaderSource: string;

        beforeAll(() => {
            loaderSource = readFileSync(resolve(ADDONS_DIR, 'AddonLoader.ts'), 'utf-8');
        });

        it('should export AddonLoader class', () => {
            expect(loaderSource).toContain('export class AddonLoader');
        });

        it('should support dynamic import', () => {
            expect(loaderSource).toContain('import(');
        });
    });

    describe('AddonRegistry', () => {
        let registrySource: string;

        beforeAll(() => {
            registrySource = readFileSync(resolve(ADDONS_DIR, 'AddonRegistry.ts'), 'utf-8');
        });

        it('should export AddonRegistry class', () => {
            expect(registrySource).toContain('export class AddonRegistry');
        });

        it('should maintain in-memory state', () => {
            expect(registrySource).toMatch(/Map|Set|Collection/);
        });

        it('should have get method', () => {
            expect(registrySource).toContain('get(');
        });

        it('should have set method', () => {
            expect(registrySource).toContain('set(');
        });
    });

    describe('AddonManager', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should export AddonManager class', () => {
            expect(managerSource).toContain('export class AddonManager');
        });

        it('should use AddonLoader', () => {
            expect(managerSource).toContain('AddonLoader');
        });

        it('should use AddonRegistry', () => {
            expect(managerSource).toContain('AddonRegistry');
        });
    });

    describe('Type Definitions', () => {
        let typesSource: string;

        beforeAll(() => {
            typesSource = readFileSync(resolve(ADDONS_DIR, 'types.ts'), 'utf-8');
        });

        it('should define AddonManifest', () => {
            expect(typesSource).toContain('AddonManifest');
        });

        it('should define AddonCommand', () => {
            expect(typesSource).toContain('AddonCommand');
        });

        it('should define AddonEventListener', () => {
            expect(typesSource).toContain('AddonEventListener');
        });

        it('should define LoadedAddon', () => {
            expect(typesSource).toContain('LoadedAddon');
        });
    });

    describe('Index Exports', () => {
        let indexSource: string;

        beforeAll(() => {
            indexSource = readFileSync(resolve(ADDONS_DIR, 'index.ts'), 'utf-8');
        });

        it('should export AddonManager', () => {
            expect(indexSource).toContain('AddonManager');
        });

        it('should export types', () => {
            expect(indexSource).toContain("from './types.js'");
        });
    });
});
