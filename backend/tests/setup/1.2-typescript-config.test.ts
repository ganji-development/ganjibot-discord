import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

interface TSConfig {
    compilerOptions: {
        target: string;
        module: string;
        moduleResolution: string;
        strict: boolean;
        esModuleInterop: boolean;
        skipLibCheck: boolean;
        outDir: string;
        rootDir: string;
        paths?: Record<string, string[]>;
        baseUrl?: string;
        [key: string]: unknown;
    };
    include?: string[];
    exclude?: string[];
}

describe('TypeScript Configuration', () => {
    let tsconfig: TSConfig;

    beforeAll(() => {
        const tsconfigPath = resolve(BACKEND_DIR, 'tsconfig.json');
        const content = readFileSync(tsconfigPath, 'utf-8');
        tsconfig = JSON.parse(content) as TSConfig;
    });

    describe('Compiler Options', () => {
        it('should target ES2022 or later', () => {
            const validTargets = ['ES2022', 'ES2023', 'ESNext'];
            expect(validTargets).toContain(tsconfig.compilerOptions.target);
        });

        it('should use NodeNext module resolution', () => {
            expect(tsconfig.compilerOptions.moduleResolution).toBe('NodeNext');
        });

        it('should have strict mode enabled', () => {
            expect(tsconfig.compilerOptions.strict).toBe(true);
        });

        it('should enable esModuleInterop', () => {
            expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
        });

        it('should skip library checks for performance', () => {
            expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
        });

        it('should output to dist directory', () => {
            expect(tsconfig.compilerOptions.outDir).toBe('./dist');
        });
    });

    describe('Build Configuration', () => {
        let buildConfig: TSConfig;

        beforeAll(() => {
            const buildConfigPath = resolve(BACKEND_DIR, 'tsconfig.build.json');
            const content = readFileSync(buildConfigPath, 'utf-8');
            buildConfig = JSON.parse(content) as TSConfig;
        });

        it('should have strict rootDir in src', () => {
            expect(buildConfig.compilerOptions.rootDir).toBe('./src');
        });
    });

    describe('Path Aliases', () => {
        it('should have baseUrl configured', () => {
            expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
        });

        it('should have path aliases defined', () => {
            expect(tsconfig.compilerOptions.paths).toBeDefined();
        });

        const expectedAliases = ['@/*', '@bot/*', '@addons/*', '@api/*', '@database/*', '@logging/*', '@config/*'];

        it.each(expectedAliases)('should have %s alias', (alias) => {
            expect(tsconfig.compilerOptions.paths).toHaveProperty(alias);
        });
    });

    describe('Includes and Excludes', () => {
        it('should include src directory', () => {
            expect(tsconfig.include).toContain('src/**/*');
        });

        it('should exclude node_modules', () => {
            expect(tsconfig.exclude).toContain('node_modules');
        });

        it('should exclude dist', () => {
            expect(tsconfig.exclude).toContain('dist');
        });
    });
});
