import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_DIR = resolve(__dirname, '../..');
const BACKEND_DIR = ROOT_DIR;
const PROJECT_ROOT = resolve(ROOT_DIR, '..');

describe('Project Structure', () => {
    describe('Root Directory', () => {
        it('should have backend directory', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'backend'))).toBe(true);
        });

        it('should have frontend directory', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'frontend'))).toBe(true);
        });

        it('should have docs directory', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'docs'))).toBe(true);
        });

        it('should have sdk directory', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'sdk'))).toBe(true);
        });
    });

    describe('Backend Structure', () => {
        const requiredDirs = [
            'src',
            'src/api',
            'src/bot',
            'src/addons',
            'src/config',
            'src/database',
            'src/logging',
            'prisma',
        ];

        it.each(requiredDirs)('should have %s directory', (dir) => {
            const dirPath = resolve(BACKEND_DIR, dir);
            expect(existsSync(dirPath)).toBe(true);
            expect(statSync(dirPath).isDirectory()).toBe(true);
        });

        it('should have package.json', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'package.json'))).toBe(true);
        });

        it('should have tsconfig.json', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'tsconfig.json'))).toBe(true);
        });

        it('should have main entry point src/index.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/index.ts'))).toBe(true);
        });

        it('should have sharding entry point src/sharding.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/sharding.ts'))).toBe(true);
        });
    });

    describe('Git Configuration', () => {
        it('should have .gitignore file', () => {
            expect(existsSync(resolve(PROJECT_ROOT, '.gitignore'))).toBe(true);
        });

        it('should have .git directory (repository initialized)', () => {
            expect(existsSync(resolve(PROJECT_ROOT, '.git'))).toBe(true);
        });
    });
});
